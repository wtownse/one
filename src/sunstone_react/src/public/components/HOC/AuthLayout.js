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

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { requestData, removeStoreData, findStorageData } from '../../utils';
import constants from '../../constants';
import components from '../router/endpoints';
import { setUser } from '../../actions';

class AuthLayout extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false
    };
    this.redirectToLogin = this.redirectToLogin.bind(this);
  }

  componentDidMount() {
    const { jwtName, endpointsRoutes } = constants;
    const { changeName } = this.props;
    if (findStorageData && findStorageData(jwtName)) {
      requestData(endpointsRoutes.userInfo).then(response => {
        if (response && response.data && response.data.USER) {
          const { USER: userInfo } = response.data;
          this.setState({ show: true });
          changeName(userInfo.NAME);
        } else {
          this.redirectToLogin();
        }
      });
    } else {
      this.redirectToLogin();
    }
  }

  redirectToLogin() {
    const { jwtName } = constants;
    const { history } = this.props;
    removeStoreData(jwtName);
    const { login } = components;
    history.push(login.path);
  }

  render() {
    const { show } = this.state;
    const { children } = this.props;
    const render = show ? <Fragment>{children}</Fragment> : <Fragment />;
    return render;
  }
}
AuthLayout.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string
  ]),
  history: PropTypes.shape({
    push: PropTypes.func
  }),
  match: PropTypes.shape({
    params: PropTypes.shape({}),
    path: PropTypes.string,
    isExact: PropTypes.bool,
    url: PropTypes.string
  }),
  changeName: PropTypes.func
};

AuthLayout.defaultProps = {
  children: [],
  history: {
    push: () => undefined
  },
  match: {
    params: {},
    path: '',
    isExact: false,
    url: ''
  },
  changeName: () => undefined
};

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch => ({
  changeName: name => dispatch(setUser(name))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AuthLayout);
