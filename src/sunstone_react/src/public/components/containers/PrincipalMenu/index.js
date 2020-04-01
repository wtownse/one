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

import React, { useState } from 'react';
import { Redirect } from 'react-router-dom';
import { List, ListItem, ListItemText, Link } from '@material-ui/core';

import endpoints from '../../router/endpoints';

const PrincipalMenu = () => {
  const { redirect, setRedirect } = useState(false);

  const routeElement = ({ path = '/', name = '' }) => (
    <ListItem key={`menu-key-${name.replace(' ', '-')}`}>
      <ListItemText primary={<Link href={path}>{name}</Link>} />
    </ListItem>
  );

  const routeElements = (title, routes) => {
    console.log('-->', title, routes);
  };

  return redirect ? (
    <Redirect to="/" />
  ) : (
    <List style={{ width: '15rem' }}>
      {Object.values(endpoints)?.map((title, routes) =>
        routes.component && routes.name
          ? routeElement(routes)
          : routeElements(title, routes)
      )}
    </List>
  );
};

export default PrincipalMenu;
