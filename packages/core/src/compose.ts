import type { AppConfigContribution, MetroContribution } from "./operations.js";

export function composeMetroConfig(contributions: MetroContribution[]) {
  const imports = [
    'const { getDefaultConfig } = require("expo/metro-config");',
    ...contributions.map(
      (item, index) =>
        `const { ${item.exportName}: wrapper${index} } = require(${JSON.stringify(item.module)});`,
    ),
  ];
  const applications = contributions.map((item, index) => {
    const suffix = item.options === undefined ? "" : `, ${JSON.stringify(item.options, null, 2)}`;
    return `config = wrapper${index}(config${suffix});`;
  });
  return `${imports.join("\n")}\n\nlet config = getDefaultConfig(__dirname);\n${applications.join("\n")}\n\nmodule.exports = config;\n`;
}

export function composeAppPlugins(contributions: AppConfigContribution[]) {
  return contributions.map((item) =>
    item.options === undefined ? item.plugin : [item.plugin, item.options],
  );
}
