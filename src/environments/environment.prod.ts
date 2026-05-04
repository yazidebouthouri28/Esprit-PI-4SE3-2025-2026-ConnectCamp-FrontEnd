/** Used when building with --configuration=production (see angular.json fileReplacements). */
export const environment = {
  production: true,
  /** Empty string = same origin; nginx / ingress reverse-proxies /api, /auth, /uploads to the backend. */
  apiUrl: '',
  allowOfflineAuth: false
};
