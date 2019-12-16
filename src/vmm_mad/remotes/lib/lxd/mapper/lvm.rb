#!/usr/bin/ruby

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

$LOAD_PATH.unshift File.dirname(__FILE__)

require 'mapper'

# Mapper interface for LVM Logical Volumes
class LVMapper < Mapper

    # Logical volume is already mapped. Only needs block device for mounting.
    def do_map(one_vm, disk, _directory)
        dsrc = File.readlink(one_vm.disk_source(disk))

        # multiple partitions # TODO: fstab
        part = show_parts(dsrc).lines[0]

        return dsrc unless part

        lv = part.match(/.*add map [0-9\-a-zA-Z_]+/)[0].split(' ').last

        return unless lv

        "/dev/mapper/#{lv}"
    end

    # Handled by the datastore drivers.
    def do_unmap(_device, _one_vm, disk, _directory)
        hide_parts(disk) # TODO: Unmap only on multiparts
        true
    end

end
