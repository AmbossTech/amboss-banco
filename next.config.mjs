import createNextIntlPlugin from 'next-intl/plugin';
import { withPlausibleProxy } from 'next-plausible';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  webpack: (config, { isServer, webpack }) => {
    const wasmRegex = /argon2.*\.wasm$/;

    config.module.rules.push({
      test: wasmRegex,
      loader: 'base64-loader',
      type: 'javascript/auto',
    });

    config.module.noParse = wasmRegex;

    config.module.rules.forEach(rule => {
      (rule.oneOf || []).forEach(oneOf => {
        if (oneOf.loader && oneOf.loader.indexOf('file-loader') >= 0) {
          oneOf.exclude.push(wasmRegex);
        }
      });
    });

    if (!isServer) {
      config.resolve.fallback.fs = false;
    }

    config.plugins.push(
      new webpack.IgnorePlugin({ resourceRegExp: /\/__tests__\// })
    );

    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    return config;
  },
};

export default withPlausibleProxy()(withNextIntl(nextConfig));
