// eslint-disable-next-line import/no-extraneous-dependencies
const { init } = require('es-module-lexer');
const path = require('path');

let isToBeConcatenated;
let visit;
(async () => {
  // eslint-disable-next-line import/no-extraneous-dependencies
  const result = await import('unist-util-visit');
  visit = result.visit;

  const config = await import('../../../../config.mjs');
  isToBeConcatenated = config.isToBeConcatenated;
})();

// function addOverviewTitleToIndexMd(tree, isIndexMd) {
//   let h1Index = null;
//   tree.children.forEach((item, index) => {
//     if (item.depth === 1 && item.type === 'heading' && isIndexMd) {
//       h1Index = index;
//     }
//   });
//   if (h1Index !== null) {
//     tree.children.splice(1, 0, {
//       type: 'heading',
//       depth: 2,
//       children: [
//         {
//           type: 'text',
//           value: 'Index',
//         },
//       ],
//     });
//   }
// }

function cleanupRocketMetadata() {
  /**
   * @param {Node} tree
   */
  async function transformer(tree, file) {
    const filePath = file.history[0];
    const isIndexMd = path.basename(filePath) === 'index-copy.md';

    /**
     * @param {UnistNode} _node
     */
    async function nodeCodeVisitor(_node, index, parent) {
      if (parent.type === 'heading' && isToBeConcatenated(filePath)) {
        if (parent.depth === 1) {
          const splitByOrder = _node.value.split('||');
          const order = splitByOrder[1]?.trim();
          if (order) {
            const splitByArrows = splitByOrder[0].split('>>');
            const title = splitByArrows[splitByArrows.length - 1].trim();
            // eslint-disable-next-line no-param-reassign
            _node.value = title;
          }
          if (isIndexMd) {
            return;
          }
        }
        // eslint-disable-next-line no-param-reassign
        parent.depth += 1;
      }
    }

    // unifiedjs expects node changes to be made on the given node...
    await init;
    visit(tree, 'text', nodeCodeVisitor);
    // addOverviewTitleToIndexMd(tree, isIndexMd);
    return tree;
  }

  return transformer;
}

module.exports = {
  cleanupRocketMetadata,
};
