/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

#include "Message.h"
#include "MonitorDriverMessages.h"
#include "OpenNebulaMessages.h"

template<>
const EString<MonitorDriverMessages> Message<MonitorDriverMessages, true, true, true, true>
    ::_type_str({
    {"UNDEFINED", MonitorDriverMessages::UNDEFINED},
    {"INIT", MonitorDriverMessages::INIT},
    {"FINALIZE", MonitorDriverMessages::FINALIZE},
    {"MONITOR_VM", MonitorDriverMessages::MONITOR_VM},
    {"MONITOR_HOST", MonitorDriverMessages::MONITOR_HOST},
    {"BEACON_HOST", MonitorDriverMessages::BEACON_HOST},
    {"SYSTEM_HOST", MonitorDriverMessages::SYSTEM_HOST},
    {"STATE_VM", MonitorDriverMessages::STATE_VM},
    {"START_MONITOR", MonitorDriverMessages::START_MONITOR},
    {"STOP_MONITOR", MonitorDriverMessages::STOP_MONITOR},
    {"LOG", MonitorDriverMessages::LOG}
});

template<>
const EString<OpenNebulaMessages> Message<OpenNebulaMessages, true, true, false, false>
    ::_type_str({
    {"UNDEFINED", OpenNebulaMessages::UNDEFINED},
    {"INIT", OpenNebulaMessages::INIT},
    {"FINALIZE", OpenNebulaMessages::FINALIZE},
    {"HOST_LIST", OpenNebulaMessages::HOST_LIST},
    {"UPDATE_HOST", OpenNebulaMessages::UPDATE_HOST},
    {"DEL_HOST", OpenNebulaMessages::DEL_HOST},
    {"START_MONITOR", OpenNebulaMessages::START_MONITOR},
    {"STOP_MONITOR", OpenNebulaMessages::STOP_MONITOR},
    {"HOST_STATE", OpenNebulaMessages::HOST_STATE},
    {"VM_STATE", OpenNebulaMessages::VM_STATE},
    {"HOST_SYSTEM", OpenNebulaMessages::HOST_SYSTEM},
    {"RAFT_STATUS", OpenNebulaMessages::RAFT_STATUS},
});
