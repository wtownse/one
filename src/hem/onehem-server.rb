#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

require 'rubygems'
require 'ffi-rzmq'
require 'nokogiri'
require 'yaml'
require 'logger'
require 'base64'

ONE_LOCATION = ENV['ONE_LOCATION']

if !ONE_LOCATION
    LOG_LOCATION  = '/var/log/one'
    VAR_LOCATION  = '/var/lib/one'
    ETC_LOCATION  = '/etc/one'
    LIB_LOCATION  = '/usr/lib/one'
    HOOK_LOCATION = '/var/lib/one/remotes/hooks'
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby'
    GEMS_LOCATION     = '/usr/share/one/gems'
else
    VAR_LOCATION  = ONE_LOCATION + '/var'
    LOG_LOCATION  = ONE_LOCATION + '/var'
    ETC_LOCATION  = ONE_LOCATION + '/etc'
    LIB_LOCATION  = ONE_LOCATION + '/lib'
    HOOK_LOCATION = ONE_LOCATION + '/var/remotest/hooks'
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     = ONE_LOCATION + '/share/gems'
end

if File.directory?(GEMS_LOCATION)
    Gem.use_paths(GEMS_LOCATION)
end

$LOAD_PATH << RUBY_LIB_LOCATION

require 'opennebula'
require 'CommandManager'
require 'ActionManager'

# Number of retries for loading hook information
RETRIES = 300

#-------------------------------------------------------------------------------
#-------------------------------------------------------------------------------
# This module includes basic functions to deal with Hooks
#-------------------------------------------------------------------------------
#-------------------------------------------------------------------------------
module HEMHook

    # --------------------------------------------------------------------------
    # Hook types
    # --------------------------------------------------------------------------
    HOOK_TYPES = [:api, :state]

    # --------------------------------------------------------------------------
    # Hook Execution
    # --------------------------------------------------------------------------
    # Parse hook arguments
    def arguments(event)
        hook_args = self['//TEMPLATE/ARGUMENTS']

        return '' unless hook_args

        begin
            event_type = event.xpath('//HOOK_TYPE')[0].text.upcase

            api      = ''
            template = ''

            case event_type
            when 'API'
                api  = event.xpath('//PARAMETERS')[0].to_s
                api += event.xpath('//RESPONSE')[0].to_s

                api = Base64.strict_encode64(api)
            when 'STATE'
                object   = event.xpath('//HOOK_OBJECT')[0].text.upcase

                template = event.xpath("//#{object}")[0].to_s
                template = Base64.strict_encode64(template)
            end
        rescue StandardError
            return ''
        end

        parguments = ''
        hook_args  = hook_args.split ' '

        hook_args.each do |arg|
            case arg
            when '$API'
                parguments << api << ' '
            when '$TEMPLATE'
                parguments << template << ' '
            else
                parguments << arg << ' '
            end
        end

        parguments
    end

    def remote_host(event)
        begin
            event_type = event.xpath('//HOOK_TYPE')[0].text.upcase

            return '' if event_type.casecmp('API').zero?

            event.xpath('//REMOTE_HOST')[0].text
        rescue StandardError
            ''
        end
    end

    # Execute the hook command
    def execute(path, params, host)
        command = self['TEMPLATE/COMMAND']

        command.prepend("#{path}/") if command[0] != '/'

        stdin = nil

        if as_stdin?
            stdin = params
        elsif !params.empty?
            command.concat(" #{params}")
        end

        if !remote?
            LocalCommand.run(command, nil, stdin, nil)
        elsif !host.empty?
            SSHCommand.run(command, host, nil, stdin, nil)
        else
            return -1
        end
    end

    #---------------------------------------------------------------------------
    # Hook attributes
    #---------------------------------------------------------------------------
    def type
        self['TYPE'].to_sym
    end

    def valid?
        HOOK_TYPES.include? type
    end

    def id
        self['ID'].to_i
    end

    def remote?
        self['TEMPLATE/REMOTE'].casecmp('YES').zero?
    end

    def as_stdin?
        astdin = self['TEMPLATE/ARGUMENTS_STDIN']
        astdin &&= (astdin.casecmp('yes') || astdin.casecmp('true'))

        return false if astdin.nil?

        astdin.zero?
    end

    # Generates a key for a given hook
    def key
        begin
            case type
            when :api
                self['TEMPLATE/CALL']
            when :state
                "#{self['//RESOURCE']}/#{self['//STATE']}/#{self['//LCM_STATE']}"
            else
                ''
            end
        rescue StandardError
            return ''
        end
    end

    # Generate a sbuscriber filter for a Hook given the type and the key
    def filter(key)
        case type
        when :api
            "EVENT API #{key}"
        when :state
            "EVENT STATE #{key}"
        else
            ''
        end
    end

end

#-------------------------------------------------------------------------------
#-------------------------------------------------------------------------------
# This class represents the hook pool synced from oned
#-------------------------------------------------------------------------------
#-------------------------------------------------------------------------------
class HookMap

    def initialize(logger)
        @hooks   = {}
        @filters = {}
        @hooks_id = {}

        @logger  = logger
        @client  = OpenNebula::Client.new
    end

    # Load Hooks from oned (one.hookpool.info) into a dictionary with the
    # following format:
    #
    # hooks[hook_type][hook_key] = Hook object
    #
    # Also generates and store the corresponding filters
    #
    # @return dicctionary containing hooks dictionary and filters
    def load
        @logger.info('Loading Hooks...')

        HEMHook::HOOK_TYPES.each do |type|
            @hooks[type] = {}
        end

        hook_pool = OpenNebula::HookPool.new(@client)
        rc = nil

        RETRIES.times do
            rc = hook_pool.info
            break unless OpenNebula.is_error?(rc)

            sleep 0.5
        end

        if OpenNebula.is_error?(rc)
            @logger.error("Cannot get hook information: #{rc.message}")
            return
        end

        hook_pool.each do |hook|
            hook.extend(HEMHook)

            if !hook.valid?
                @logger.error("Error loading hooks. Invalid type: #{hook.type}")
                next
            end

            key = hook.key

            @hooks[hook.type][key] = hook
            @hooks_id[hook.id]     = hook
            @filters[hook.id]      = hook.filter(key)
        end

        @logger.info('Hooks successfully loaded')
    end

    def load_hook(hook_id)
        # get new hook info
        hook = OpenNebula::Hook.new_with_id(hook_id, @client)
        rc   = hook.info

        if !rc.nil?
            @logger.error("Error getting hook #{hook_id}.")
            return
        end

        # Generates key and filter for the new hook info
        hook.extend(HEMHook)
        
        key    = hook.key
        filter = hook.filter(key)

        @hooks[hook.to_type][key] = hook
        @hooks_id[hook_id] = hook
        @filters[hook_id]  = filter

        @logger.info("Hook (#{hook_id}) successfully reloaded")

        hook
    end

    def delete(hook_id)
        hook = @hooks_id[hook_id]
        
        @hooks[hook.type].delete(hook.key)
        @filters.delete(hook_id)
        @hooks_id.delete(hook_id)
    end

    # Execute the given lambda on each event filter in the map
    def each_filter(&block)
        @filters.each_value {|f| block.call(f) }
    end

    # Returns a hook by key
    def get_hook(type, key)
        @hooks[type.downcase.to_sym][key]
    end

    def get_hook_by_id(id)
        @hooks_id[id]
    end

end

# ------------------------------------------------------------------------------
# ------------------------------------------------------------------------------
# Hook Execution Manager class
# ------------------------------------------------------------------------------
# ------------------------------------------------------------------------------
class HookExecutionManager

    attr_reader :am

    # --------------------------------------------------------------------------
    # Default configuration options, overwritten in hem.conf
    # --------------------------------------------------------------------------
    DEFAULT_CONF = {
        :hook_base_path      => HOOK_LOCATION,
        :subscriber_endpoint => 'tcp://localhost:5556',
        :replier_endpoint    => 'tcp://localhost:5557',
        :debug_level         => 2,
        :concurrency         => 10
    }

    # --------------------------------------------------------------------------
    # File paths
    # --------------------------------------------------------------------------
    CONFIGURATION_FILE = ETC_LOCATION + '/onehem-server.conf'
    HEM_LOG            = LOG_LOCATION + '/onehem.log'

    # --------------------------------------------------------------------------
    # API calls which trigger hook info reloading and filters to suscribe to
    # --------------------------------------------------------------------------
    UPDATE_CALLS = [
        'one.hook.update',
        'one.hook.allocate',
        'one.hook.delete'
    ]

    ACTIONS = [
        :EVENT,
        :RETRY
    ]

    const_set('STATIC_FILTERS', UPDATE_CALLS.map {|e| "EVENT API #{e} 1" })

    # --------------------------------------------------------------------------
    # Logger configuration
    # --------------------------------------------------------------------------
    DEBUG_LEVEL = [
        Logger::ERROR, # 0
        Logger::WARN,  # 1
        Logger::INFO,  # 2
        Logger::DEBUG  # 3
    ]

    # Mon Feb 27 06:02:30 2012 [Clo] [E]: Error message example
    MSG_FORMAT  = %(%s [%s]: %s\n)
    # Mon Feb 27 06:02:30 2012
    DATE_FORMAT = '%a %b %d %H:%M:%S %Y'

    # --------------------------------------------------------------------------
    # --------------------------------------------------------------------------
    def initialize
        # ----------------------------------------------------------------------
        # Load config from configuration file
        # ----------------------------------------------------------------------
        begin
            conf = YAML.load_file(CONFIGURATION_FILE)
        rescue StandardError => e
            STDERR.puts "Error loading #{CONFIGURATION_FILE}: #{e.message}"
            exit 1
        end

        @conf = DEFAULT_CONF.merge(conf)

        # ----------------------------------------------------------------------
        # Init log system
        # ----------------------------------------------------------------------
        @logger       = Logger.new(HEM_LOG)
        @logger.level = DEBUG_LEVEL[@conf[:debug_level].to_i]

        @logger.formatter = proc do |severity, datetime, _progname, msg|
            format(MSG_FORMAT, datetime.strftime(DATE_FORMAT),
                   severity[0..0], msg)
        end

        #-----------------------------------------------------------------------
        # 0mq related variables
        #   - context (shared between all the sockets)
        #   - suscriber and requester sockets (exclusive access)
        #-----------------------------------------------------------------------
        @context    = ZMQ::Context.new(1)
        @subscriber = @context.socket(ZMQ::SUB)
        @requester  = @context.socket(ZMQ::REQ)

        @requester_lock = Mutex.new

        # Maps for existing hooks and filters and oned client
        @hooks = HookMap.new(@logger)

        # Internal event manager
        @am = ActionManager.new(@conf[:concurrency], true)
        @am.register_action(ACTIONS[0], method('execute_action'))
        @am.register_action(ACTIONS[1], method('retry_action'))
    end

    ############################################################################
    # Helpers
    ############################################################################
    # Subscribe the subscriber socket to the given filter
    def subscribe(filter)
        # TODO, check params
        @subscriber.setsockopt(ZMQ::SUBSCRIBE, filter)
    end

    # Unsubscribe the subscriber socket from the given filter
    def unsubscribe(filter)
        # TODO, check params
        @subscriber.setsockopt(ZMQ::UNSUBSCRIBE, filter)
    end

    ############################################################################
    # Hook manager methods
    ############################################################################
    # Subscribe to the socket filters and STATIC_FILTERS
    def load_hooks
        @hooks.load

        # Subscribe to hooks modifier calls
        STATIC_FILTERS.each {|filter| subscribe(filter) }

        # Subscribe to each existing hook
        @hooks.each_filter {|filter| subscribe(filter) }

        # subscribe to RETRY actions
        subscribe('RETRY')
    end

    def reload_hooks(call, info_xml)
        id = -1

        # TODO, what happens if not int?
        if call == 'one.hook.allocate'
            id = info_xml.xpath('//RESPONSE/OUT2')[0].text.to_i
        else
            id = info_xml.xpath('//PARAMETERS/PARAMETER2')[0].text.to_i
        end

        if call != 'one.hook.allocate'
            hook = @hooks.get_hook_by_id(id)

            @hooks.delete(id)
            unsubscribe(hook.filter(hook.key))
        end

        return if call == 'one.hook.delete'

        hook = @hooks.load_hook(id)
        
        return unless hook
        
        key = hook.key
        subscribe(hook.filter(key))
    end

    ############################################################################
    # Hook Execution Manager main loop
    ############################################################################

    def hem_loop
        # Connect subscriber/requester sockets
        @subscriber.connect(@conf[:subscriber_endpoint])

        @requester.connect(@conf[:replier_endpoint])

        # Initialize @hooks and filters
        load_hooks

        loop do
            key     = ''
            content = ''

            @subscriber.recv_string(key)
            @subscriber.recv_string(content)

            @logger.debug("New event receive\nkey: #{key}\ncontent: #{content}")

            # get action
            action = key.split(' ').shift.to_sym

            # remove action from key
            key = key.split(' ')[1..-1].flatten.join(' ')

            case action
            when :EVENT
                type, key = key.split(' ')
                content   = Base64.decode64(content)
                hook      = @hooks.get_hook(type, key)

                body_xml = Nokogiri::XML(content)

                @am.trigger_action(ACTIONS[0], 0, hook, body_xml) unless hook.nil?

                reload_hooks(key, body_xml) if UPDATE_CALLS.include? key
            when :RETRY
                body     = Base64.decode64(content.split(' ')[0])
                body_xml = Nokogiri::XML(body)

                # Get Hook
                hk_id = body_xml.xpath('//HOOK_ID')[0].text.to_i
                hook  = @hooks.get_hook_by_id(hk_id)

                @am.trigger_action(ACTIONS[1], 0, hook, body_xml)
            end
        end
    end

    def build_response_body(args, as_stdin, rc, remote_host, remote, is_retry)
        xml_response = "<ARGUMENTS>#{args}</ARGUMENTS>" \
                       "#{rc.to_xml}"

        xml_response.concat("<REMOTE_HOST>#{remote_host}</REMOTE_HOST>") if !remote_host.empty? && remote

        xml_response.concat('<RETRY>yes</RETRY>') if is_retry

        Base64.strict_encode64(xml_response)
    end

    def execute_action(hook, event)
        ack = ''

        params = hook.arguments(event)
        host   = hook.remote_host(event)

        rc = hook.execute(@conf[:hook_base_path], params, host)

        if rc == -1
            @logger.error('No remote host specified for a remote hook.')
            return
        end

        if rc.code.zero?
            @logger.info("Hook successfully executed for #{hook.key}")
        else
            @logger.error("Failure executing hook for #{hook.key}")
        end

        xml_response = build_response_body(params, hook.as_stdin?, rc, host, hook.remote?, false)

        @requester_lock.synchronize {
            @requester.send_string("#{rc.code} #{hook.id} #{xml_response}")
            @requester.recv_string(ack)
        }

        @logger.error("Wrong ACK message: #{ack}.") if ack != 'ACK'
    end

    def retry_action(hook, body)
        ack  = ''

        args = Base64.decode64(body.xpath('//ARGUMENTS')[0].text)
        host = ''

        host = body.xpath('//REMOTE_HOST')[0].text unless body.xpath('//REMOTE_HOST')[0].nil?

        rc = hook.execute(@conf[:hook_base_path], args, host)

        xml_response = build_response_body(args, hook.as_stdin?, rc, host, !host.empty?, true)

        @requester_lock.synchronize {
            @requester.send_string("#{rc.code} #{hook.id} #{xml_response}")
            @requester.recv_string(ack)
        }

        @logger.error("Wrong ACK message: #{ack}.") if ack != 'ACK'
    end

    def start
        hem_thread = Thread.new { hem_loop }
        @am.start_listener
        hem_thread.kill
    end

end

################################################################################
################################################################################
#
#
################################################################################
################################################################################
Signal.trap('INT') do
    exit(0)
end

Signal.trap('QUIT') do
    exit(0)
end

hem = HookExecutionManager.new
hem.start