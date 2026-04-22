module.exports = function(eleventyConfig) {
	
  eleventyConfig.addPassthroughCopy("styles");
  eleventyConfig.addPassthroughCopy({ "assets/images": "images" });
  eleventyConfig.addPassthroughCopy({ "assets/js": "js" });

  return {
	dir: {
	  input: "pages",
	  includes: "../_includes",
	  data: "../_data",
	  output: "_site"
	}
  };
};