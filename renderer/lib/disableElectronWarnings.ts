export function disableElectronWarnings() {
  if (typeof window !== 'undefined') {
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
  }
}
