import storage from './storage.js';
import compute from './compute.js';
import container from './container.js';
import database from './database.js';
import network from './network.js';
import security from './security.js';
import integration from './integration.js';

import web from './web.js';
import identity from './identity.js';
import management from './management.js';
import governance from './governance.js';
import observability from './observability.js';
import analytics from './analytics.js';
import messaging from './messaging.js';
import iot from './iot.js';
import devops from './devops.js';
import aiMl from './ai-ml.js';
import virtualDesktop from './virtual-desktop.js';
import media from './media.js';
import backupDr from './backup-dr.js';
import migration from './migration.js';
import hybridArc from './hybrid-arc.js';
import costFinops from './cost-finops.js';
import developerTools from './developer-tools.js';
import misc from './misc.js';

export default [
  ...storage,
  ...compute,
  ...container,
  ...database,
  ...network,
  ...security,
  ...integration,

  ...web,
  ...identity,
  ...management,
  ...governance,
  ...observability,
  ...analytics,
  ...messaging,
  ...iot,
  ...devops,
  ...aiMl,
  ...virtualDesktop,
  ...media,
  ...backupDr,
  ...migration,
  ...hybridArc,
  ...costFinops,
  ...developerTools,
  ...misc
];
