/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/graphql',
  //       destination: 'http://localhost:5000/api/graphql',
  //     },
  //   ];
  // },
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

    // // Perform customizations to webpack config
    config.plugins.push(
      new webpack.IgnorePlugin({ resourceRegExp: /\/__tests__\// })
    );

    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    // Important: return the modified config
    return config;
  },
};

export default nextConfig;
