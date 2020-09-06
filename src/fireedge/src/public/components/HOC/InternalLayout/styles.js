import { makeStyles } from '@material-ui/core';
import { sidebar, toolbar } from 'client/assets/theme/defaults';

export default makeStyles(theme => ({
  root: {
    flex: '1 1 auto',
    display: 'flex',
    zIndex: '3',
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'column',
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    }),
    [theme.breakpoints.up('lg')]: {
      marginLeft: sidebar.minified
    }
  },
  isDrawerFixed: {
    [theme.breakpoints.up('lg')]: {
      marginLeft: sidebar.fixed
    }
  },
  main: {
    paddingBottom: 30,
    height: '100vh',
    width: '100%',
    // paddingTop: 64
    paddingTop: toolbar.regular,
    [`${theme.breakpoints.up('xs')} and (orientation: landscape)`]: {
      paddingTop: toolbar.xs
    },
    [theme.breakpoints.up('sm')]: {
      paddingTop: toolbar.sm
    }
  },
  scrollable: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    height: '100%',
    overflow: 'auto',
    '&::-webkit-scrollbar': {
      width: 14
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundClip: 'content-box',
      border: '4px solid transparent',
      borderRadius: 7,
      boxShadow: 'inset 0 0 0 10px',
      color: theme.palette.primary.light
    }
  },
  /* ROUTES TRANSITIONS */
  appear: {},
  appearActive: {},
  enter: {
    opacity: 0
  },
  enterActive: {
    opacity: 1,
    transition: 'opacity 300ms'
  },
  exit: {
    opacity: 1,
    transform: 'scale(1)'
  },
  exitActive: {
    opacity: 0,
    transition: 'opacity 300ms'
  },
  enterDone: {},
  exitDone: {}
}));
