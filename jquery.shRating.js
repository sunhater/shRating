/*!
 * jQuery shRating v1.0
 * http://jquery.sunhater.com/shRating
 * 2014-01-19
 *
 * Copyright (c) 2010-2014 Pavel Tzonkov <sunhater@sunhater.com>
 * Dual licensed under the MIT and GPL licenses.
 */

(function($) {
    $.fn.shRating = function(options) {

        var filename = "jquery.shRating.js",    // It MUST be identical as the real filename.
                                                // For auto-detect stars image path (./ prefix).
                                                // Not important for absolute stars image URL
        o = { // Plugin options
            best: 5,  // best rating
            value: 0, // rating value
            count: 0, // rating count

            disabled: false,    // Set to true if user voted already
            ajaxUrl: "",        // AJAX response URL {value} marks rating value
            callBack: false,    // callback function, called on user vote
            starWidth: 30,      // Star image width
            starHeight: 30,     // Star image height
            empty: false,       // Empty the selector

            cssClass: "shRating",           // CSS class for stars div
            starsImage: "./stars30.png",    // "./" means this script directory

            stats: ["None", "Poor", "Fair", "Good", "Very Good", "Excellent"], // false means no value words

            labels: {                       // Text labels
                error: "Unknown error!"
            },

            alertFunc: function(msg) {
                alert(msg);
            }
        },

        script = $('script[src$="/' + filename + '"]'),

        markup = {
            best: "bestRating",
            value: "ratingValue",
            count: "ratingCount"
        };

        // Extend options
        if (typeof options == "undefined")
            options = {};
        $.extend(o, options);

        // Auto path ./ stars image
        if ((o.starsImage.substr(0, 2) == "./") &&
            script.get(0)
        ) {
            src = script.first().attr('src');
            o.starsImage = src.substr(0, src.length - filename.length) + o.starsImage.substr(2, o.starsImage.length - 2);
        }

        // Apply selector
        $(this).each(function() {
            var t = this,
                opt = $.extend({}, o),
                h = $('head'),
                b = $('body'),
                html = "";

            // Get data
            $.each(markup, function(i, m) {
                if ((typeof options[i] == "undefined")) {
                    var m = $(t).find('[itemprop="' + m + '"]'),
                        a = $(t).attr(i),
                        c = $(t).find('.' + i);

                    // from markup
                    if (m.get(0)) {
                        var a = m.attr('content'),
                            oo = a ? a : m.text();
                        opt[i] = oo ? parseFloat(oo) : 0;

                    // from attribute
                    } else if (a)
                        opt[i] = parseFloat(a);

                    // from inner element with class name as the name of data element
                    else if (c.get(0))
                        opt[i] = parseFloat(c.text());
                }
            });

            if (typeof opt.stats[Math.ceil(opt.value)] != "undefined") {
                var w = opt.stats[Math.ceil(opt.value)],
                    i = "ratingWord";
                $(t).find('[itemprop="' + i + '"]').html(w);
                $(t).find('.' + i).html(w);
            }

            var st = '<div class="' + opt.cssClass + '"><div class="ratingEmpty"><div class="ratingBar"></div></div></div>',
                exist = $(t).find('div > div.ratingEmpty');

            if (exist.get(0))
                exist.parent().detach();

            if (opt.empty)
                $(t).html(st);
            else
                $(t).prepend(st);

            // CSS
            var c = "." + opt.cssClass;
            if (!$('#css_' + opt.cssClass).get(0)) {
                var s =
                    c + '{display:block;}' +
                    c + ' *{display:block;outline:0;border:0;margin:0;padding:0;}' +
                    c + ' .ratingEmpty{background:top left repeat-x;}' +
                    c + ' .ratingBar{position:absolute;float:left;background:bottom left repeat-x;}' +
                    c + ' .ratingChoice a,' + c + ' .ratingChoice a:hover{position:absolute;background:center left;text-decoration:none;float:left;}';
                s = '<style type="text/css" id="css_' + opt.cssClass + '">' + s + '</style>';
                if (h.get(0))
                    h.append(s);
                else if (b.get(0))
                    b.append(s);
            }
            $(t).find(c).css({
                width: (opt.starWidth * opt.best) + 'px',
                height: opt.starHeight + 'px'
            });
            $(t).find(c + " *").css({
                height: opt.starHeight + 'px'
            });
            $(t).find(c + " .ratingEmpty").css({
                backgroundImage: 'url("' + opt.starsImage + '")',
                width: (opt.starWidth * opt.best) + 'px'
            });
            $(t).find(c + " .ratingBar").css({
                backgroundImage: 'url("' + opt.starsImage + '")',
                width: parseInt(opt.value * opt.starWidth) + "px"
            });

            if (!opt.disabled) {

                $(t).find(c + ' .ratingEmpty').append('<div class="ratingChoice"></div>');
                for (var i = 0; i < opt.best; i++)
                    $(t).find(c + " .ratingChoice").append('<a href="#">&nbsp;</a>');

                $(t).find(c + " .ratingChoice a").each(function(i, a) {
                    var j = opt.best - i;
                    $(a).css({
                        width: (j * opt.starWidth) + 'px',
                        height: opt.starHeight + 'px'
                    }).data('value', j);
                    if (opt.stats[j])
                        $(a).attr('title', opt.stats[j]);

                }).mouseenter(function() {
                    $(this).css('background-image', 'url("' + opt.starsImage + '")');

                }).mouseleave(function() {
                    $(this).css('background-image', 'none');

                }).unbind('click').click(function() {
                    var a = this;

                    if (!opt.ajaxUrl.length)
                        opt.alertFunc(opt.labels.error);
                    else
                        $.ajax({
                            url: opt.ajaxUrl.replace('{value}', $(a).data('value')),
                            dataType: 'json',
                            success: function(json) {
                                if (!json) {
                                    opt.alertFunc(opt.labels.error);
                                    return false;
                                }
                                if ((!json.rating && !json.value) || (!json.votes && !json.count))
                                    opt.alertFunc(json.error ? json.error : opt.labels.error);
                                else {
                                    var v = parseFloat(json.value ? json.value : json.rating),
                                        c = parseInt(json.count ? json.count : json.votes),
                                        w = opt.stats[Math.ceil(v)],
                                        updateMarkup = function(id, value) {
                                            var e = $(t).find('[itemprop="' + (markup[id] ? markup[id] : id) + '"]'),
                                                c = $(t).find('.' + id);

                                            if (e.get(0)) {
                                                if (e.is('[content]'))
                                                    e.attr('content', value);
                                                else
                                                    e.html(value);
                                            } else if ($(t).is('[' + id + ']'))
                                                $(t).attr(id, value);
                                            else if (c.get(0))
                                                c.html(value);
                                        };

                                    updateMarkup("value", v);
                                    updateMarkup("count", c);
                                    updateMarkup("ratingWord", w);

                                    $(t).find('.' + opt.cssClass + ' .ratingBar').css({
                                        width: (v * opt.starWidth) + "px"
                                    });
                                    $(t).find('.' + opt.cssClass + ' .ratingChoice').detach();
                                    if (opt.callBack)
                                        opt.callBack(json);
                                }
                            },
                            error: function() {
                                opt.alertFunc(opt.labels.error);
                            }
                        });
                    return false;
                });
            }
        });

    };
})(jQuery);
