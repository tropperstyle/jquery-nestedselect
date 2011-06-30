/**
* @license jQuery Nested Select
* https://github.com/tropperstyle/jquery-nestedselect
*
* Copyright, Jonathan Tropper.
* Dual licensed under the MIT or GPL Version 2 licenses.
*
* MIT-LICENSE.txt
* GPL-LICENSE.txt
*/

(function($) {
    $.widget('jt.nestedselect', {
        options: {
            initial: null,
            attribute: 'nested-value-id'
        },

        _create: function() {
            var base = this;

            this.dialog = $('<div class="jt-nestedselect-dialog"/>').dialog({
                autoOpen: false,
                modal: true,
                resizable: false,
                title: base.element.val(),
                width: 635,
                buttons: {
                    Cancel: function() { base.close(); },
                    Select: function() { base.close(true); }
                }
            });

            this.active;

            this.cache = {};

            this.wrapper = $('<div class="jt-nestedselect-wrapper"/>').appendTo(this.dialog);
            this.container = $('<div class="jt-nestedselect-container"/>').appendTo(this.wrapper);

            this.container.delegate('.jt-nestedselect-group', 'nestedselect:remove', function() {
                $(this).loading(false).remove();
            });

            this.element.button().bind('click', function() {
                base.open();
            });

            this._populate(this._nestData(), this._retrieveData(this.options.initial));

            this._toggleButton();
        },

        _retrieveData: function(nested_id) {
            if (this.cache[nested_id]) { return this.cache[nested_id]; }

            var calculated_value;
            switch($.type(this.options.data)) {
                case 'string':
                    calculated_value = this.options.data;
                    break;
                case 'function':
                    calculated_value = this.options.data(nested_id);
                    break;
                default:
                    throw('Invalid data option: ' + this.options.data.toString());
            }

            return this.cache[nested_id] = calculated_value;
        },

        _nestData: function() {
            var element = $('<div class="jt-nestedselect-group"/>').html('<ul/>').appendTo(this.container);

            this.container.width(function(i, original) {
                // We never want to skrink the container
                var calculated = element.outerWidth(true) * (element.index() + 2);
                return calculated > original ? calculated : original;
            });

            return element;
        },

        _toggleSlide: function() {
            var base = this;
            var offset = 0;
            var group_count = this.container.children('.jt-nestedselect-group').length;

            if (group_count > this.maxNesting) { offset = this.groupWidth * (group_count - this.maxNesting); }

            // If scrolling left, delay a bit so it is a more natural transition for the user
            var delay = (offset < this.wrapper.attr('scrollLeft') ? 600 : 0);

            window.setTimeout(function() {
                base.wrapper.animate({ scrollLeft: offset }, 600);
            }, delay);
        },

        _populate: function(element, data) {
            var base = this;

            $.when(data).done(function(value) {
                var list = element.loading(false).find('ul');
                list.html(value.responseText || value);
                list.menu({
                    selected: function(event, ui) {
                        var group = ui.item.closest('.jt-nestedselect-group');

                        group.find('.ui-state-active').removeClass('ui-state-active');
                        ui.item.find('a').removeClass('ui-state-hover').addClass('ui-state-active');

                        if (ui.item.hasClass('nested-select-leaf')) {
                            base.active = ui.item;
                        } else {
                            base.active = null;
                        }

                        group.nextAll('.jt-nestedselect-group').trigger('nestedselect:remove');

                        if (ui.item.hasClass('nested-select-root')) {
                            base._populate(base._nestData().loading(), base._retrieveData(ui.item.attr(base.options.attribute)));
                        }

                        base._toggleButton();
                        base._toggleSlide();
                    }
                });

                list.show('slide', { direction: 'left', speed: 'fast' });
            });
        },

        _toggleButton: function() {
            var button = this.dialog.closest('.ui-dialog').find('.ui-dialog-buttonset button:last');

            if (this.active) {
                button.removeAttr('disabled').removeClass('ui-state-disabled');
            } else {
                button.attr('disabled', true).addClass('ui-state-disabled');
            }
        },

        path: function() {
            return $.map(this.container.find('.ui-state-active'), function(e) { return $.trim($(e).text()); })
        },

        open: function() {
            this.dialog.dialog('open');
            this.groupWidth = this.container.find('.jt-nestedselect-group:first').outerWidth(true);
            this.maxNesting = Math.floor(this.wrapper.width() / this.groupWidth);
        },

        close: function(save) {
            if (save) {
                this._trigger('selected', $.Event('selected'), {
                    value: this.active.attr(this.options.attribute),
                    element: this.active,
                    path: this.path().join(' &gt; ')
                });
            }

            this.dialog.dialog('close');
        }
    });
})(jQuery);
