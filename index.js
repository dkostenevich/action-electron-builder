const { execSync } = require("child_process");
const { existsSync, readFileSync } = require("fs");
const { join } = require("path");

/**
 * Logs to the console
 */
const log = msg => console.log(`\n${msg}`); // eslint-disable-line no-console

/**
 * Exits the current process with an error code and message
 */
const exit = msg => {
	console.error(msg);
	process.exit(1);
};

/**
 * Executes the provided shell command and redirects stdout/stderr to the console
 */
const run = (cmd, cwd) => execSync(cmd, { encoding: "utf8", stdio: "inherit", cwd });

/**
 * Determines the current operating system (one of ["mac", "windows", "linux"])
 */
const getPlatform = () => {
	switch (process.platform) {
		case "darwin":
			return "mac";
		case "win32":
			return "windows";
		default:
			return "linux";
	}
};

/**
 * Returns the value for an environment variable (or `null` if it's not defined)
 */
const getEnv = name => process.env[name.toUpperCase()] || null;

/**
 * Sets the specified env variable if the value isn't empty
 */
const setEnv = (name, value) => {
	if (value) {
		process.env[name.toUpperCase()] = value.toString();
	}
};

/**
 * Returns the value for an input variable (or `null` if it's not defined). If the variable is
 * required and doesn't have a value, abort the action
 */
const getInput = (name, required) => {
	const value = getEnv(`INPUT_${name}`);
	if (required && !value) {
		exit(`"${name}" input variable is not defined`);
	}
	return value;
};

/**
 * Installs NPM dependencies and releases the Electron app
 */
const runAction = () => {
	const platform = getPlatform();
	const pkgRoot = getInput("package_root", true);
	const provider = getInput("provider", true);

	const pkgJsonPath = join(pkgRoot, "package.json");
	const pkgLockPath = join(pkgRoot, "package-lock.json");

	// Determine whether NPM should be used to run commands (instead of Yarn, which is the default)
	const useNpm = existsSync(pkgLockPath);
	log(`Will run ${useNpm ? "NPM" : "Yarn"} commands in directory "${pkgRoot}"`);

	// Make sure `package.json` file exists
	if (!existsSync(pkgJsonPath)) {
		exit(`\`package.json\` file not found at path "${pkgJsonPath}"`);
	}

	if (provider === 'github') {
		// Copy "github_token" input variable to "GH_TOKEN" env variable (required by `electron-builder`)
		setEnv("GH_TOKEN", getInput("github_token", true));
	} else if (provider === 'spaces') {
		// Copy "do_key_id" & "do_sercet_key" input variable to "DO_KEY_ID" & "DO_SECRET_KEY" env variables (required by `electron-builder`)
		setEnv("DO_KEY_ID", getInput("do_key_id", true));
		setEnv("DO_SECRET_KEY", getInput("do_secret_key", true));
	} else {
		exit(`"${provider}" not supported`);
	}

	// Require code signing certificate and password if building for macOS. Export them to environment
	// variables (required by `electron-builder`)
	if (platform === "mac") {
		setEnv("CSC_LINK", getInput("mac_certs", true));
		setEnv("CSC_KEY_PASSWORD", getInput("mac_certs_password", true));
		setEnv("APPLEID", getInput("apple_id", true));
		setEnv("APPLEIDPASS", getInput("apple_id_pass", true));
	} else if (platform === "windows") {
		setEnv("WIN_CSC_LINK", getInput("windows_certs", true));
		setEnv("WIN_CSC_KEY_PASSWORD", getInput("windows_certs_password", true));
	}

	// Disable console advertisements during install phase
	setEnv("ADBLOCK", true);

	log(`Installing dependencies using ${useNpm ? "NPM" : "Yarn"}…`);
	run(useNpm ? "npm install" : "yarn", pkgRoot);

	log(`Building and releasing the Electron app…`);
	run(
		`${useNpm ? "npx --no-install" : "yarn run"} electron-builder --${platform} --publish always`,
		pkgRoot
	);
};

runAction();
