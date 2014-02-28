define(function(require, exports, module) {
    var $ = require('jquery');
    var Overlay = require('overlay');

    var Popup = Overlay.extend({
        attrs: {
            trigger: null, // 触发元素

            triggerType: 'hover', // 触发类型，如: click hover focus

            delegateNode: null, // 事件委托对象

            delay: 70, // 延迟触发和隐藏时间

            disabled: false, // 是否能够触发

            // 定位配置
            align: {
                // element 的定位点，默认为左上角
                elementPos: '0 0',

                // 基准定位元素的定位点，默认为左上角
                targetPos: '0 100%'
            },

            // 基本的动画效果，可取值 'fade'(渐隐显示), 'slide'(滑动显示)，组合可取值 'fade slide'
            effect: '',

            // 动画的持续时间
            duration: 250
        },

        _bindTrigger: function() {
            var self = this;

            switch (self.get('triggerType')) {
                case 'click':
                    self._bindTriggerClick();
                    break;
                case 'focus':
                    self._bindTriggerFocus();
                    break;
                default:
                    self.get('delay') < 1 ?
                        self._bindTriggerHover() :
                        self._bindTriggerHoverDelay();
                    break;
            }
        },

        /**
         * 点击触发
         * @private
         */
        _bindTriggerClick: function() {
            var self = this;

            bindEvent('click', self.get('trigger'), function(event) {
                event.preventDefault();

                if (self.get('disabled')) {
                    return;
                }

                var $this = $(this);

                // 当前触发元素是激活状态
                if (self.get('visible') === true &&
                    self.$activeTrigger[0] === $this[0]) {

                    self.hide();
                } else {
                    // 将当前trigger标为激活状态
                    self.$activeTrigger = $this;

                    self.show();
                }
            }, self.get('delegateNode'));
        },

        /**
         * 焦点触发
         * @private
         */
        _bindTriggerFocus: function() {
            var self = this;

            var $trigger = self.get('trigger');
            var $delegateNode = self.get('delegateNode');

            var hideTimer;

            bindEvent('focus', $trigger, function() {
                // 标识当前点击的元素
                self.$activeTrigger = $(this);

                self.show();
            }, $delegateNode);

            bindEvent('blur', $trigger, function() {
                hideTimer = setTimeout(function() {
                    hideTimer = null;

                    self.hide();
                }, self.get('delay'));
            }, $delegateNode);

            bindEvent('mousedown', self.$el, function() {
                clearTimeout(hideTimer);
                hideTimer = null;
            });
        },

        /**
         * 移上出发（计时延迟）
         * @private
         */
        _bindTriggerHoverDelay: function() {
            var self = this;

            var showTimer, hideTimer;

            var trigger = self.get('trigger');
            var delegateNode = self.get('delegateNode');
            var delay = self.get('delay');

            var leaveHandler = function(e) {
                clearTimeout(showTimer);
                showTimer = null;

                if (self.get('visible')) {
                    hideTimer = setTimeout(function() {
                        self.hide();
                    }, delay);
                }
            };

            bindEvent('mouseenter', trigger, function() {
                clearTimeout(hideTimer);
                hideTimer = null;

                // 标识当前点击的元素
                self.$activeTrigger = $(this);
                showTimer = setTimeout(function() {
                    self.show();
                }, delay);
            }, delegateNode);

            bindEvent('mouseleave', trigger, leaveHandler, delegateNode);

            // 鼠标在悬浮层上时不消失
            bindEvent('mouseenter', self.$el, function() {
                clearTimeout(hideTimer);
            });
            bindEvent('mouseleave', self.$el, leaveHandler);

            bindEvent('mouseleave', 'select', function(event) {
                event.stopPropagation();
            }, self.$el);

        },
        /**
         * 移上触发
         * @private
         */
        _bindTriggerHover: function() {
            var self = this;

            var trigger = self.get('trigger');
            var delegateNode = self.get('delegateNode');

            bindEvent('mouseenter', trigger, function() {
                // 标识当前点击的元素
                self.$activeTrigger = $(this);
                self.show();
            }, delegateNode);

            bindEvent('mouseleave', trigger, function() {
                self.hide();
            }, delegateNode);

        },

        _onChangeVisible: function(val, originVal, options) {
            // 新建时不继续执行
            if (options.create === true) {
                return;
            }

            var self = this;

            var effects = self.get('effect').split(' ');
            var props = {};
            var effect, fade, slide;

            // http://code.jquery.com/jquery-1.8.3.js
            // #9121-#9128
            while (effect = effects.shift()) {
                if (effect == 'fade') {
                    props.opacity = val ? 'show' : 'hide';
                } else if (effect == 'slide') {
                    props.height = val ? 'show' : 'hide';
                }
            }

            if (props.height || props.opacity) {
                self.$el.stop(true, true)
                        .animate(props, self.get('duration'), function() {
                            val || self._iframeShim.position();
                            self.trigger('animateComplete');
                        }).css('visibility', 'visible');
            } else {
                Overlay.prototype._onChangeVisible.apply(self, arguments);
            }
        },

        setup: function() {
            var self = this;

            Overlay.prototype.setup.apply(self, arguments);

            var $trigger = self.get('trigger');
            if (!($trigger instanceof $)) {
                self.set('trigger', $($trigger));
            }
            var $delegateNode = self.get('delegateNode');
            if ($delegateNode && !($delegateNode instanceof $)) {
                self.set('delegateNode', $($delegateNode));
            }

            self._bindTrigger();
            self._blurHide(self.get('trigger'));

            self.$activeTrigger = self.get('trigger').eq(0);
        },

        /**
         * 渲染组件
         * @returns {Popup}
         */
        render: function() {
            var self = this;

            Overlay.prototype.render.apply(self, arguments);

            self.$el.css('display', 'none');

            return self;
        },

        show: function() {
            var self = this;

            if (self.get('disabled')) {
                return self;
            }

            if (self.get('delegateNode')) {
                self._relativeElements = self.get('trigger');
                self._relativeElements.push(self.$el);
            }

            var oldAlign = self.get('align');
            oldAlign.targetNode = self.$activeTrigger;
            self.set('align', oldAlign);

            return Overlay.prototype.show.apply(self);
        },

        hide: function() {
            var self = this;

            return Overlay.prototype.hide.apply(self);
        },

        /**
         * 移除浮层
         * @returns {Popup}
         */
        remove: function() {
            var self = this;

            return Overlay.prototype.remove.apply(self, arguments);
        }
    });


    module.exports = Popup;

    // 一个绑定事件的简单封装
    function bindEvent(type, $element, fn, $delegateNode) {
        var hasDelegateNode = $delegateNode && $delegateNode[0];

        var args = [type];
        if (hasDelegateNode) {
            args.push($element.selector);

            $element = $delegateNode;
        }
        args.push(fn);

        $element.on.apply($element, args);
    }
});