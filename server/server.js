import Hapi from 'hapi';
import { forEach } from 'lodash';
import pem from 'pem';
import jwtSettings from './private/jwt_settings';
import config from './config/server_config';
import authRoutes from './routes/authentication';
import birdsRoutes from './routes/birds';
import protocolRoutes from './routes/protocol';
import uiRoutes from './routes/ui';

import dashboardMock from './routes/mock/dashboard'; // to-do: delete it when API is ready
import searchMock from './routes/mock/search'; // to-do: delete it when API is ready
import profileMock from './routes/mock/profile'; // to-do: delete it when API is ready

const server = new Hapi.Server({
  debug: {
    log: ['error', 'implementation', 'internal'],
    request: ['error', 'implementation', 'internal']
  }
});

pem.createCertificate({
  days: config.certificate.days,
  selfSigned: config.certificate.self_signed
}, function (error, keys) {
  if (error) {
    throw error;
  }
  
  const tls = {
    key: keys.serviceKey,
    cert: keys.certificate
  };
  
  server.connection({
    port: config.http_port
  });
  
  server.connection({
    port: config.https_port,
    tls
  });
  
  // JWT authentication and encryption
  server.register([
    require('h2o2'),
    require('hapi-auth-jwt'),
    require('inject-then'),
    require('inert')
  ], function (error) {
    if (error) {
      console.log('Error was handled!');
      console.log(error);
    }
  
    server.auth.strategy('token', 'jwt', {
      key: jwtSettings.key, // the JWT private key
      verifyOptions: {
        algorithms: [ jwtSettings.algorithm ],
      }
    });
  
    // Initialize routes
    forEach([authRoutes, birdsRoutes, protocolRoutes, uiRoutes, dashboardMock, searchMock, profileMock], function (routes) {
      forEach(routes, function (route) {
        server.route(route);
      });
    });
  });
  
  // Server start
  server.start(function (error) {
    if (error) {
      console.log('Error was handled!');
      console.log(error);
    }
  
    if (server.info) {
      console.log(`Server started at ${server.info.uri}`);
    } else {
      console.log('Server started');
    }
  });

});

export default server;