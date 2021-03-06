/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

const express = require('express');
const { defaults, httpCodes, params } = require('../../utils/constants');
const {
  opennebulaConnect,
  checkRouteFunction,
  commandXML,
  checkOpennebulaCommand,
  validateRouteFunction,
  responseOpennebula,
  httpResponse
} = require('../../utils');

const {
  validateResource,
  optionalParameters,
  optionalQueries,
  clearStates,
  getParamsState,
  getQueriesState,
  getIdUserOpennebula,
  getUserOpennebula,
  getPassOpennebula
} = require('./middlewares');

const {
  defaultOpennebulaZones,
  defaultMessageInvalidZone,
  defaultGetMethod,
  httpMethod: httpMethods,
  from: fromData
} = defaults;

const router = express.Router();

express();

const paramsToRoutes = () =>
  Object.keys(params).reduce(
    (resources, param) => String(resources).concat(`/:${params[param]}?`),
    '/:resource?'
  );

const getDataZone = () => {
  let rtn;
  const Zones = (global && global.zones) || defaultOpennebulaZones;
  if (Zones && Array.isArray(Zones)) {
    const { federation } = getParamsState();
    rtn = Zones[0];
    if (federation !== null) {
      rtn = Zones.find(
        zone => zone && zone.ID !== undefined && String(zone.ID) === federation
      );
    }
  }
  return rtn;
};

router.all(
  paramsToRoutes(),
  [validateResource, optionalParameters, optionalQueries],
  (req, res, next) => {
    const { internalServerError, ok, methodNotAllowed } = httpCodes;
    const { method: httpMethod } = req;
    res.locals.httpCode = httpResponse(internalServerError);
    const zone = getDataZone();
    if (zone) {
      const { RPC } = zone;
      const connectOpennebula = (
        user = getUserOpennebula(),
        pass = getPassOpennebula()
      ) => opennebulaConnect(user, pass, RPC);
      const { resource } = req.params;
      const routeFunction = checkRouteFunction(resource);
      res.locals.httpCode = httpResponse(methodNotAllowed);
      const dataSources = {
        [fromData.resource]: getParamsState(),
        [fromData.query]: getQueriesState(),
        [fromData.postBody]: req.body
      };
      if (routeFunction) {
        const valRouteFunction = validateRouteFunction(
          routeFunction,
          httpMethod
        );
        if (valRouteFunction) {
          valRouteFunction(
            dataSources,
            res,
            next,
            connectOpennebula,
            getIdUserOpennebula(),
            `${getUserOpennebula()}:${getPassOpennebula()}`
          );
        } else {
          next();
        }
      } else {
        const { method } = getParamsState();
        const command = commandXML(
          resource,
          method,
          httpMethod === httpMethods.GET && defaultGetMethod
        );
        const getOpennebulaMethod = checkOpennebulaCommand(command, httpMethod);
        if (getOpennebulaMethod) {
          const response = (val = {}) => {
            res.locals.httpCode = httpResponse(ok, val || val === 0 ? val : {});
            if (typeof val === 'string') {
              res.locals.httpCode = httpResponse(ok, undefined, val);
            }
            next();
          };

          const updaterResponse = code => {
            if ('id' in code && 'message' in code) {
              res.locals.httpCode = code;
            }
          };
          const connect = connectOpennebula(
            getUserOpennebula(),
            getPassOpennebula(),
            RPC
          );
          connect(command, getOpennebulaMethod(dataSources), (err, value) =>
            responseOpennebula(updaterResponse, err, value, response, next)
          );
        } else {
          next();
        }
      }
    } else {
      res.locals.httpCode.message += `: ${defaultMessageInvalidZone}`;
      next();
    }
  },
  (req, res) => {
    clearStates();
    const { httpCode } = res.locals;
    res.status(httpCode.id).json(httpCode);
  }
);

module.exports = router;
