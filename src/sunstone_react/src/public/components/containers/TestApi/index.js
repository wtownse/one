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
import { Button, TextField, FormControl, Grid } from '@material-ui/core';
import constants from '../../../constants';
import commands from '../../../../config/commands-params';
import { Translate, Tr } from '../../HOC';

const { Submit, Response } = constants;

const TestApi = () => {
  const [data, setData] = useState('');

  const handleSubmit = (e, method) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      console.log('-->', method);
    }
  };

  return (
    <Grid container direction="row">
      {Object.entries(commands)?.map(([title, values]) => {
        const method = (values && values.httpMethod) || 'GET';
        const params = values && values.params;
        return (
          <Grid item xs={12}>
            <h2>{title}</h2>
            <Grid container direction="column">
              <Grid item xs={12}>
                <FormControl>
                  <form onSubmit={e => handleSubmit(e, method)}>
                    {Object.entries(params)?.map(([name, param]) => (
                      // console.log(param);
                      <TextField
                        label={name}
                        multiline
                        rows="4"
                        defaultValue="Default Value"
                        variant="outlined"
                      />
                    ))}
                    <Button variant="contained" color="primary" type="submit">
                      <Translate word={Submit} />
                    </Button>
                  </form>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  disabled
                  label={Tr(Response)}
                  multiline
                  rows="4"
                  defaultValue={data}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default TestApi;
