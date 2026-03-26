import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.5fdb1da35ef14d389d2290b081003375',
  appName: 'I Am AI Ready',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    MediaCapture: {
      permissions: ['microphone']
    }
  }
};

export default config;
