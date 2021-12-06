const { InputDataService } = require('../src/program/core/InputDataService.js');
const { QueryService } = require('../src/program/core/QueryService.js');
const { GlobalConfig } = require('../src/program/core/GlobalConfig.js');
const { restoreMockedProjects } = require('./mock-project-helpers.js');
const { mockWriteToJson, restoreWriteToJson } = require('./mock-report-service-helpers.js');
const {
  suppressNonCriticalLogs,
  restoreSuppressNonCriticalLogs,
} = require('./mock-log-service-helpers.js');

/**
 * @typedef {import('../src/program/types/core').QueryResult} QueryResult
 * @returns {QueryResult[]}
 */

function setupAnalyzerTest() {
  /** @type {QueryResult[]} */
  const queryResults = [];

  const originalReferenceProjectPaths = InputDataService.referenceProjectPaths;
  const cacheDisabledQInitialValue = QueryService.cacheDisabled;
  const cacheDisabledIInitialValue = InputDataService.cacheDisabled;
  const cacheDisabledInitialValue = GlobalConfig.cacheDisabled;

  before(() => {
    QueryService.cacheDisabled = true;
    InputDataService.cacheDisabled = true;
    GlobalConfig.cacheDisabled = true;
    suppressNonCriticalLogs();
  });

  after(() => {
    QueryService.cacheDisabled = cacheDisabledQInitialValue;
    InputDataService.cacheDisabled = cacheDisabledIInitialValue;
    GlobalConfig.cacheDisabled = cacheDisabledInitialValue;
    restoreSuppressNonCriticalLogs();
  });

  beforeEach(() => {
    InputDataService.referenceProjectPaths = [];
    mockWriteToJson(queryResults);
  });

  afterEach(() => {
    InputDataService.referenceProjectPaths = originalReferenceProjectPaths;
    restoreWriteToJson(queryResults);
    restoreMockedProjects();
  });

  return queryResults;
}

module.exports = { setupAnalyzerTest };
