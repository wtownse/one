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

import React, { createElement } from 'react';
import { Route, Switch } from 'react-router-dom';
import PropTypes from 'prop-types';
import { AuthLayout } from '../HOC';
import Error404 from '../containers/Error404';
import InternalLayout from '../HOC/InternalLayout';
import endpoints from './endpoints';

const routeElement = ({
  path = '/',
  name = '',
  authenticated = true,
  component
}) => (
  <Route
    key={`key-${name.replace(' ', '-')}`}
    exact
    path={path}
    component={({ match, history }) =>
      authenticated ? (
        <AuthLayout history={history} match={match}>
          <InternalLayout title={name}>
            {createElement(component)}
          </InternalLayout>
        </AuthLayout>
      ) : (
        createElement(component, { history, match })
      )
    }
  />
);

routeElement.propTypes = {
  path: PropTypes.string,
  name: PropTypes.string,
  authenticated: PropTypes.bool,
  component: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string
  ])
};

routeElement.defaultProps = {
  path: '/',
  name: '',
  authenticated: true,
  component: ''
};

function Routes() {
  return (
    <Switch>
      {Object.values(endpoints)?.map(routes =>
        routes.component
          ? routeElement(routes)
          : Object.entries(routes)?.map(route => routeElement(route))
      )}
      <Route component={() => <Error404 />} />
    </Switch>
  );
}

export default Routes;
export { endpoints };
