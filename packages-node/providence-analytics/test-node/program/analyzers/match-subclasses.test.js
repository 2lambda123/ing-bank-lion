const { expect } = require('chai');
const { providence } = require('../../../src/program/providence.js');
const { QueryService } = require('../../../src/program/core/QueryService.js');
const { mockTargetAndReferenceProject } = require('../../../test-helpers/mock-project-helpers.js');
const { setupAnalyzerTest } = require('../../../test-helpers/setup-analyzer-test.js');

// 1. Reference input data
const referenceProject = {
  path: '/importing/target/project/node_modules/exporting-ref-project',
  name: 'exporting-ref-project',
  files: [
    // This file contains all 'original' exported definitions
    {
      file: './ref-src/core.js',
      code: `
        // named specifier
        export class RefClass extends HTMLElement {};

        // default specifier
        export default class OtherClass {};
      `,
    },
    // This file is used to test file system 'resolvements' -> importing repos using
    // `import 'exporting-ref-project/ref-src/folder'` should be pointed to this index.js file
    {
      file: './index.js',
      code: `
        export { RefClass as RefRenamedClass } from './ref-src/core.js';

        // re-exported default specifier
        import refConstImported from './ref-src/core.js';
        export default refConstImported;

        export const Mixin = superclass => class MyMixin extends superclass {}
      `,
    },
  ],
};

const searchTargetProject = {
  path: '/importing/target/project',
  name: 'importing-target-project',
  files: [
    {
      file: './target-src/indirect-imports.js',
      // Indirect (via project root) imports
      code: `
      // renamed import (indirect, needs transitivity check)
      import { RefRenamedClass } from 'exporting-ref-project';
      import defaultExport from 'exporting-ref-project';

      class ExtendRefRenamedClass extends RefRenamedClass {}
    `,
    },
    {
      file: './target-src/direct-imports.js',
      code: `
      // a direct named import
      import { RefClass } from 'exporting-ref-project/ref-src/core.js';

      // a direct default import
      import RefDefault from 'exporting-ref-project';

      // a direct named mixin
      import { Mixin } from 'exporting-ref-project';

      // Non match
      import { ForeignMixin } from 'unknow-project';

      class ExtendRefClass extends RefClass {}
      class ExtendRefDefault extends RefDefault {}
      class ExtendRefClassWithMixin extends ForeignMixin(Mixin(RefClass)) {}
    `,
    },
  ],
};

const matchSubclassesQueryConfig = QueryService.getQueryConfigFromAnalyzer('match-subclasses');
const _providenceCfg = {
  targetProjectPaths: [searchTargetProject.path],
  referenceProjectPaths: [referenceProject.path],
};

// 2. Extracted specifiers (by find-exports analyzer)
const expectedExportIdsIndirect = ['RefRenamedClass::./index.js::exporting-ref-project'];

const expectedExportIdsDirect = [
  // ids should be unique across multiple projects
  // Not in scope: version number of a project.
  'RefClass::./ref-src/core.js::exporting-ref-project',
  '[default]::./index.js::exporting-ref-project',
  'Mixin::./index.js::exporting-ref-project',
];
// eslint-disable-next-line no-unused-vars
const expectedExportIds = [...expectedExportIdsIndirect, ...expectedExportIdsDirect];

// 3. The AnalyzerQueryResult generated by "match-subclasses"
// eslint-disable-next-line no-unused-vars
const expectedMatchesOutput = [
  {
    exportSpecifier: {
      name: 'RefClass',
      // name under which it is registered in npm ("name" attr in package.json)
      project: 'exporting-ref-project',
      filePath: './ref-src/core.js',
      id: 'RefClass::./ref-src/core.js::exporting-ref-project',

      // TODO: next step => identify transitive relations and add inside
      // most likely via post processor
    },
    // All the matched targets (files importing the specifier), ordered per project
    matchesPerProject: [
      {
        project: 'importing-target-project',
        files: [
          { file: './target-src/indirect-imports.js', identifier: 'ExtendedRefClass' },
          // ...
        ],
      },
      // ...
    ],
  },
];

// eslint-disable-next-line no-shadow

describe('Analyzer "match-subclasses"', () => {
  const queryResults = setupAnalyzerTest();

  describe('Match Features', () => {
    it(`identifies all directly imported class extensions`, async () => {
      const refProject = {
        path: '/target/node_modules/ref',
        name: 'ref',
        files: [{ file: './LionComp.js', code: `export class LionComp extends HTMLElement {};` }],
      };
      const targetProject = {
        path: '/target',
        name: 'target',
        files: [
          {
            file: './WolfComp.js',
            code: `
        import { LionComp } from 'ref/LionComp.js';

        export class WolfComp extends LionComp {}
        `,
          },
        ],
      };
      mockTargetAndReferenceProject(targetProject, refProject);
      await providence(matchSubclassesQueryConfig, {
        targetProjectPaths: [targetProject.path],
        referenceProjectPaths: [refProject.path],
      });
      const queryResult = queryResults[0];
      expect(queryResult.queryOutput).eql([
        {
          exportSpecifier: {
            filePath: './LionComp.js',
            id: 'LionComp::./LionComp.js::ref',
            name: 'LionComp',
            project: 'ref',
          },
          matchesPerProject: [
            {
              files: [
                { file: './WolfComp.js', identifier: 'WolfComp', memberOverrides: undefined },
              ],
              project: 'target',
            },
          ],
        },
      ]);
    });

    it(`identifies all indirectly imported (transitive) class extensions`, async () => {
      const refProject = {
        path: '/target/node_modules/ref',
        name: 'ref',
        files: [
          { file: './LionComp.js', code: `export class LionComp extends HTMLElement {};` },
          {
            file: './RenamedLionComp.js',
            code: `export { LionComp as RenamedLionComp } from './LionComp.js';`,
          },
        ],
      };
      const targetProject = {
        path: '/target',
        name: 'target',
        files: [
          {
            file: './WolfComp2.js',
            code: `
        import { RenamedLionComp } from 'ref/RenamedLionComp.js';

        export class WolfComp2 extends RenamedLionComp {}
        `,
          },
        ],
      };
      mockTargetAndReferenceProject(targetProject, refProject);
      await providence(matchSubclassesQueryConfig, {
        targetProjectPaths: [targetProject.path],
        referenceProjectPaths: [refProject.path],
      });
      const queryResult = queryResults[0];
      expect(queryResult.queryOutput).eql([
        {
          exportSpecifier: {
            filePath: './RenamedLionComp.js',
            id: 'RenamedLionComp::./RenamedLionComp.js::ref',
            name: 'RenamedLionComp',
            project: 'ref',
          },
          matchesPerProject: [
            {
              files: [
                { file: './WolfComp2.js', identifier: 'WolfComp2', memberOverrides: undefined },
              ],
              project: 'target',
            },
          ],
        },
      ]);
    });

    it(`identifies Mixins`, async () => {
      const refProject = {
        path: '/target/node_modules/ref',
        name: 'ref',
        files: [
          {
            file: './LionMixin.js',
            code: `
          export function LionMixin(superclass) {
            return class extends superclass {};
          }`,
          },
        ],
      };
      const targetProject = {
        path: '/target',
        name: 'target',
        files: [
          {
            file: './WolfCompUsingMixin.js',
            code: `
        import { LionMixin } from 'ref/LionMixin.js';

        export class WolfCompUsingMixin extends LionMixin(HTMLElement) {}
        `,
          },
        ],
      };
      mockTargetAndReferenceProject(targetProject, refProject);
      await providence(matchSubclassesQueryConfig, {
        targetProjectPaths: [targetProject.path],
        referenceProjectPaths: [refProject.path],
      });
      const queryResult = queryResults[0];
      expect(queryResult.queryOutput).eql([
        {
          exportSpecifier: {
            filePath: './LionMixin.js',
            id: 'LionMixin::./LionMixin.js::ref',
            name: 'LionMixin',
            project: 'ref',
          },
          matchesPerProject: [
            {
              files: [
                {
                  file: './WolfCompUsingMixin.js',
                  identifier: 'WolfCompUsingMixin',
                  memberOverrides: undefined,
                },
              ],
              project: 'target',
            },
          ],
        },
      ]);
    });
  });

  describe('Extracting exports', () => {
    describe('Inside small example project', () => {
      it(`identifies all indirect export specifiers consumed by "importing-target-project"`, async () => {
        mockTargetAndReferenceProject(searchTargetProject, referenceProject);
        await providence(matchSubclassesQueryConfig, _providenceCfg);
        const queryResult = queryResults[0];
        expectedExportIdsIndirect.forEach(indirectId => {
          expect(
            queryResult.queryOutput.find(
              exportMatchResult => exportMatchResult.exportSpecifier.id === indirectId,
            ),
          ).not.to.equal(undefined, `id '${indirectId}' not found`);
        });
      });

      it(`identifies all direct export specifiers consumed by "importing-target-project"`, async () => {
        mockTargetAndReferenceProject(searchTargetProject, referenceProject);
        await providence(matchSubclassesQueryConfig, _providenceCfg);
        const queryResult = queryResults[0];
        expectedExportIdsDirect.forEach(directId => {
          expect(
            queryResult.queryOutput.find(
              exportMatchResult => exportMatchResult.exportSpecifier.id === directId,
            ),
          ).not.to.equal(undefined, `id '${directId}' not found`);
        });
      });
    });
  });

  describe('Matching', () => {
    // TODO: because we intoduced an object in match-classes, we find duplicate entries in
    // our result set cretaed in macth-subclasses. Fix there...
    it.skip(`produces a list of all matches, sorted by project`, async () => {
      function testMatchedEntry(targetExportedId, queryResult, importedByFiles = []) {
        const matchedEntry = queryResult.queryOutput.find(
          r => r.exportSpecifier.id === targetExportedId,
        );

        const [name, filePath, project] = targetExportedId.split('::');
        expect(matchedEntry.exportSpecifier).to.eql({
          name,
          filePath,
          project,
          id: targetExportedId,
        });
        expect(matchedEntry.matchesPerProject[0].project).to.equal('importing-target-project');
        expect(matchedEntry.matchesPerProject[0].files).to.eql(importedByFiles);
      }

      mockTargetAndReferenceProject(searchTargetProject, referenceProject);
      await providence(matchSubclassesQueryConfig, _providenceCfg);
      const queryResult = queryResults[0];

      expectedExportIdsDirect.forEach(targetId => {
        testMatchedEntry(targetId, queryResult, [
          // TODO: 'identifier' needs to be the exported name of extending class
          {
            identifier: targetId.split('::')[0],
            file: './target-src/direct-imports.js',
            memberOverrides: undefined,
          },
        ]);
      });

      expectedExportIdsIndirect.forEach(targetId => {
        testMatchedEntry(targetId, queryResult, [
          // TODO: 'identifier' needs to be the exported name of extending class
          { identifier: targetId.split('::')[0], file: './target-src/indirect-imports.js' },
        ]);
      });
    });
  });
});
