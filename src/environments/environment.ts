import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: false,
  appName: 'ASP Administration Portal',
  appShortName: 'ASP Admin',
  tagline: "The Digital Operating System for Ghana's District Assemblies.",
  /**
   * This build is UI-only — every screen runs off the mock data in
   * `core/data`. The base URL is kept here so swapping PortalService for HTTP
   * calls later is a one-file change.
   */
  useMockData: true,
  baseUrl: '/api/v1',
  supportEmail: 'ict@gaeast.gov.gh',
  supportPhone: '+233 (0)30 200 0001',
  /**
   * PrimeUI licence key (PrimeNG v22+). Community keys are free from
   * https://primeui.dev/pricing. Without one the library still works but shows
   * an "invalid licence" banner.
   */
  primengLicense:
    'eyJpZCI6IjkxYThlNWI3LTliZGQtNGQwMS1hYjc1LWY2MDRlMWM5OTczYiIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3ODQzMDg0MzEsImV4cCI6MTgxNTg0NDQzMX0.yg0-IvfX1VnMX4q6nNZThMoB96vdcgBh38sPequzEP9JV26KUoZrFg3tpQAzjQmefUEIXGFmnXlOLnqO2cQyCg',
};
