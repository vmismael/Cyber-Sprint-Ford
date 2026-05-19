// Web stub for native-only modules (e.g. react-native-maps).
// The corresponding `.web.tsx` route renders a fallback UI instead of using these exports.
module.exports = new Proxy(
  {},
  {
    get() {
      return () => null;
    },
  },
);
module.exports.default = module.exports;
module.exports.PROVIDER_GOOGLE = undefined;
