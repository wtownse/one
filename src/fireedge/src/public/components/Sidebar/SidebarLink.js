import React from 'react';
import PropTypes from 'prop-types';
import { useHistory, useLocation } from 'react-router-dom';
import clsx from 'clsx';

import {
  withStyles,
  Badge,
  Typography,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery
} from '@material-ui/core';

import useGeneral from 'client/hooks/useGeneral';
import sidebarStyles from 'client/components/Sidebar/styles';

const StyledBadge = withStyles(() => ({
  badge: {
    right: -25,
    top: 13,
    fontSize: '0.7rem'
  }
}))(Badge);

const SidebarLink = ({ label, path, icon: Icon, devMode, isSubItem }) => {
  const classes = sidebarStyles();
  const history = useHistory();
  const { pathname } = useLocation();
  const { fixMenu } = useGeneral();
  const isUpLg = useMediaQuery(theme => theme.breakpoints.up('lg'));

  const handleClick = () => {
    history.push(path);
    !isUpLg && fixMenu(false);
  };

  const isCurrentPathname = pathname === path;

  return (
    <ListItem
      button
      onClick={handleClick}
      selected={isCurrentPathname}
      className={clsx({ [classes.subItem]: isSubItem })}
      classes={{ selected: classes.itemSelected }}
    >
      {Icon && (
        <ListItemIcon>
          <Icon />
        </ListItemIcon>
      )}
      <ListItemText
        primary={
          devMode ? (
            <StyledBadge badgeContent="DEV" color="primary">
              <Typography>{label}</Typography>
            </StyledBadge>
          ) : (
            label
          )
        }
      />
    </ListItem>
  );
};

SidebarLink.propTypes = {
  label: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  icon: PropTypes.node,
  devMode: PropTypes.bool,
  isSubItem: PropTypes.bool
};

SidebarLink.defaultProps = {
  label: '',
  path: '/',
  icon: null,
  devMode: false,
  isSubItem: false
};

export default SidebarLink;
