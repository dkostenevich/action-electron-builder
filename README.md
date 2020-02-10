# Electron Builder Action

**GitHub Action for building and releasing Electron apps**

This is a GitHub Action for automatically building and releasing your Electron app using GitHub's CI/CD capabilities. It uses [`electron-builder`](https://github.com/electron-userland/electron-builder) to package your app and release it to a platform like GitHub Releases.

GitHub Actions allows you to build your app on macOS, Windows and Linux without needing direct access to each of these operating systems.

## Setup

1. **Install and configure `electron-builder`** (v22+) in your Electron app. You can read about this in [the project's docs](https://www.electron.build).

2. If you need to compile code (e.g. TypeScript to JavaScript or Sass to CSS), make sure this is done using a **`build` script in your `package.json` file**. The action will execute that script before packaging your app. However, **make sure that the `build` script does _not_ run `electron-builder`**, as this action will do that for you.

3. **Add a workflow file** to your project (e.g. `.github/workflows/build.yml`):

   ```yml
   name: Build/release

   on: push

   jobs:
     release:
       runs-on: ${{ matrix.os }}

       strategy:
         matrix:
           os: [macos-latest, ubuntu-latest, windows-latest]

       steps:
         - name: Check out Git repository
           uses: actions/checkout@v1

         - name: Install Node.js, NPM and Yarn
           uses: actions/setup-node@v1
           with:
             node-version: 10

         - name: Build/release Electron app
           uses: dkostenevich/action-electron-builder@v1
           with:
             # GitHub token, automatically provided to the action
             # (No need to define this secret in the repo settings)
             github_token: ${{ secrets.github_token }}
   ```

## Usage

## Configuration

### Options

You can configure the action further with the following options:

- `package_root`: Directory where NPM/Yarn commands should be run (default: `"."`)
- `build_script_name`: Name of the optional NPM build script which is executed before `electron-builder` (default: `"build"`)

See [`action.yml`](./action.yml) for a list of all possible input variables.

### Code Signing

If you are building for **macOS**, you'll want your code to be signed. GitHub Actions therefore needs access to your code signing certificates:

- Open the Keychain Access app or the Apple Developer Portal. Export all certificates related to your app into a _single_ file (e.g. `certs.p12`) and set a strong password
- Base64-encode your certificates using the following command: `base64 -i certs.p12 -o encoded.txt`
- In your project's GitHub repository, go to Settings → Secrets and add the following two variables:
  - `mac_certs`: Your encoded certificates, i.e. the content of the `encoded.txt` file you created before
  - `mac_certs_password`: The password you set when exporting the certificates

Add the following options to your workflow's existing `action-electron-builder` step:

```yml
- name: Build/release Electron app
  uses: dkostenevich/action-electron-builder@v1
  with:
    # ...
    mac_certs: ${{ secrets.mac_certs }}
    mac_certs_password: ${{ secrets.mac_certs_password }}
```

The same goes for **Windows** code signing (`windows_certs` and `windows_certs_password` secrets).

### Notarization

If you've configured `electron-builder` to notarize your Electron Mac app [as described in this guide](https://samuelmeuli.com/blog/2019-12-28-notarizing-your-electron-app), you can use the following steps to let GitHub Actions perform the notarization for you:

1.  Pass the following environment variables to `action-electron-builder`:

    ```yml
    - name: Build/release Electron app
      uses: dkostenevich/action-electron-builder@v1
      with:
        # ...
      env:
        # macOS notarization API key
        API_KEY_ID: ${{ secrets.api_key_id }}
        API_KEY_ISSUER_ID: ${{ secrets.api_key_issuer_id }}
    ```

## Example

For an example of the action used in production (including app notarization and publishing to Snapcraft)

## Development

Suggestions and contributions are always welcome! Please discuss larger changes via issue before submitting a pull request.
