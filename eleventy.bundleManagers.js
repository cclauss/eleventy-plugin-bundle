
const pkg = require("./package.json");
const CodeManager = require("./codeManager.js");
const debug = require("debug")("Eleventy:Bundle");

module.exports = function(eleventyConfig, pluginOptions = {}) {
	if("getBundleManagers" in eleventyConfig || "addBundle" in eleventyConfig) {
		throw new Error("Duplicate plugin calls for " + pkg.name);
	}

	let managers = {};

	function addBundle(name, bundleOptions = {}) {
		if(name in managers) {
			debug("Bundle exists %o, skipping.", name);
			// note: shortcode must still be added
		} else {
			debug("Creating new bundle %o", name);
			managers[name] = new CodeManager(name);

			if(bundleOptions.hoist !== undefined) {
				managers[name].setHoisting(bundleOptions.hoist);
			}

			if(bundleOptions.outputFileExtension) {
				managers[name].setFileExtension(bundleOptions.outputFileExtension);
			}

			if(bundleOptions.transforms) {
				managers[name].setTransforms(bundleOptions.transforms);
			}
		}

		// if undefined, defaults to `name`
		if(bundleOptions.shortcodeName !== false) {
			let shortcodeName = bundleOptions.shortcodeName || name;

			// e.g. `css` shortcode to add code to page bundle
			// These shortcode names are not configurable on purpose (for wider plugin compatibility)
			eleventyConfig.addPairedShortcode(shortcodeName, function addContent(content, bucket, urlOverride) {
				let url = urlOverride || this.page.url;
				managers[name].addToPage(url, content, bucket);
				return "";
			});
		}
	};

	eleventyConfig.addBundle = addBundle;

	eleventyConfig.getBundleManagers = function() {
		return managers;
	};

	eleventyConfig.on("eleventy.before", async () => {
		for(let key in managers) {
			managers[key].reset();
		}
	});
};
