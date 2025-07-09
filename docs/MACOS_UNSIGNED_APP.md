# Running Unsigned willisMD on macOS

Since willisMD is not currently code-signed with an Apple Developer certificate, macOS may show a security warning when you try to open it. This is especially common on Apple Silicon (M1/M2/M3) Macs.

## If you see "willisMD is damaged and can't be opened"

This message appears because macOS Gatekeeper blocks unsigned applications. To fix this:

### Option 1: Remove Quarantine Attribute (Recommended)

1. Open Terminal
2. Navigate to where you downloaded/extracted willisMD
3. Run the following command:
   ```bash
   xattr -cr willisMD.app
   ```
4. Try opening the app again

### Option 2: Allow in Security Settings

1. Try to open willisMD by right-clicking and selecting "Open"
2. If you see a security warning, click "Cancel"
3. Go to System Settings > Privacy & Security
4. Look for a message about willisMD being blocked
5. Click "Open Anyway"
6. Try opening the app again and click "Open" when prompted

### Option 3: Temporarily Disable Gatekeeper (Not Recommended)

**Warning**: This reduces your system security. Re-enable it after installing.

1. Open Terminal
2. Disable Gatekeeper:
   ```bash
   sudo spctl --master-disable
   ```
3. Install and run willisMD
4. Re-enable Gatekeeper:
   ```bash
   sudo spctl --master-enable
   ```

## Future Plans

We're working on getting proper code signing certificates to eliminate these warnings. In the meantime, please use one of the methods above to run willisMD on your Mac.

## Still Having Issues?

If you continue to experience problems:
1. Make sure you downloaded the correct version (arm64 for Apple Silicon, x64 for Intel)
2. Try downloading with a different browser
3. Check that the download completed successfully
4. Report the issue on our [GitHub Issues](https://github.com/lacy-digital-labs/willisMD/issues) page