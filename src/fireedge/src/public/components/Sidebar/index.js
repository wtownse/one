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

import React from 'react';
import clsx from 'clsx';
import {
  List,
  Drawer,
  Divider,
  Box,
  IconButton,
  useMediaQuery
} from '@material-ui/core';
import { Menu as MenuIcon, Close as CloseIcon } from '@material-ui/icons';

import useGeneral from 'client/hooks/useGeneral';
import endpoints from 'client/router/endpoints';

import sidebarStyles from 'client/components/Sidebar/styles';
import SidebarLink from 'client/components/Sidebar/SidebarLink';
import SidebarCollapseItem from 'client/components/Sidebar/SidebarCollapseItem';
import Logo from 'client/icons/logo';

const Endpoints = React.memo(() =>
  endpoints
    ?.filter(({ authenticated, header = false }) => authenticated && !header)
    ?.map((endpoint, index) =>
      endpoint.routes ? (
        <SidebarCollapseItem key={`item-${index}`} {...endpoint} />
      ) : (
        <SidebarLink key={`item-${index}`} {...endpoint} />
      )
    )
);

const Sidebar = () => {
  const classes = sidebarStyles();
  const { isFixMenu, fixMenu } = useGeneral();
  const isUpLg = useMediaQuery(theme => theme.breakpoints.up('lg'));

  const handleSwapMenu = () => fixMenu(!isFixMenu);

  return React.useMemo(
    () => (
      <Drawer
        variant={'permanent'}
        className={clsx({ [classes.drawerFixed]: isFixMenu })}
        classes={{
          paper: clsx(classes.drawerPaper, {
            [classes.drawerFixed]: isFixMenu
          })
        }}
        anchor="left"
        open={isFixMenu}
      >
        <Box item className={classes.header}>
          <Logo
            width="100%"
            height={100}
            withText
            viewBox="0 0 640 640"
            className={classes.svg}
          />
          <IconButton
            color={isFixMenu ? 'primary' : 'default'}
            onClick={handleSwapMenu}
          >
            {isUpLg ? <MenuIcon /> : <CloseIcon />}
          </IconButton>
        </Box>
        <Divider />
        <Box className={classes.menu}>
          <List className={classes.list} disablePadding>
            <Endpoints />
          </List>
        </Box>
      </Drawer>
    ),
    [isFixMenu, fixMenu, isUpLg]
  );
};

export default Sidebar;
