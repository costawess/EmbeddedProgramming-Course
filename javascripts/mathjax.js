window.MathJax = {
    tex: {
        inlineMath: [["$", "$"], ["\\(", "\\)"]],
        displayMath: [["$$", "$$"], ["\\[", "\\]"]]
    },
    options: { skipHtmlTags: ["script", "noscript", "style", "textarea", "pre", "code"] }
};

// Material replaces page content during instant navigation; typeset the new page.
if (typeof document$ !== "undefined") {
    document$.subscribe(() => {
        const math = window.MathJax;
        if (math.startup?.promise) {
            math.startup.promise.then(() => {
                math.typesetClear();
                return math.typesetPromise();
            });
        }
    });
}
