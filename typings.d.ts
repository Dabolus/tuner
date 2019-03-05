declare module 'script-ext-html-webpack-plugin' {
  import webpack from 'webpack';

  export interface ScriptExtHtmlWebpackPluginConfig {
    defaultAttribute?: string;
  }

  export default class ScriptExtHtmlWebpackPlugin extends webpack.Plugin {
    constructor(options: ScriptExtHtmlWebpackPluginConfig);
  }
}

declare module 'terser-webpack-plugin' {
  import webpack from 'webpack';

  export interface TerserPluginConfiguration {
    cache: boolean;
    parallel: boolean;
    extractComments: boolean;
  }

  export default class TerserPlugin extends webpack.Plugin {
    constructor(config: TerserPluginConfiguration);
  }
}

declare module 'terser' {
  export function minify(code: string): {
    code: string,
  };
}

declare module 'workbox-webpack-plugin' {
  import webpack from 'webpack';

  export interface InjectManifestConfig {
    swSrc: string;
    swDest: string;
    exclude?: RegExp[];
  }

  export class InjectManifest extends webpack.Plugin {
    constructor(config: InjectManifestConfig);
  }
}
