define(function(require, exports, module) {
    var $ = require('jquery');
    var Overlay = require('overlay');

    var Popup = Overlay.extend({
        attrs: {
            trigger: null, // 触发元素

            triggerType: 'hover', // 触发类型, 如: click hover focus

            delegateNode: null, // 事件委托对象

            delay: 70, // 延迟触发和隐藏时间

            disabled: false, // 是否能够触发

            // 定位配置
            align: {
                // element 的定位点，默认为左上角
                elementPos: '0 100%',

                // 基准定位元素，默认为当前可视区域
                targetNode: false,

                // 基准定位元素的定位点，默认为左上角
                targetPos: '0 0'
            }
        },

        _bindTrigger: function() {
            var self = this;
            var triggerType = self.get('triggerType');

            var $delegateNode = self.get('delegateNode');
            var isDelegate = $delegateNode && $delegateNode[0];

            var events;
            switch (triggerType) {
                case 'click':
                    events = self._bindClick(isDelegate);
                    break;
                case 'focus':
                    events = self._bindFocus(isDelegate);
                    break;
                default:
                    events = self._bindHover(isDelegate);
                    break;
            }

            !!events && self.delegateEvents(events);
        },

        _bindClick: function() {

        },
        _bindFocus: function() {},
        _bindHover: function() {},

        setup: function() {
            var self = this;

            Overlay.prototype.setup.apply(self, arguments);

            var $trigger = self.get('trigger');
            if (!($trigger instanceof $)) {
                self.set('trigger', $($trigger));
            }
            var $delegateNode = self.get('delegateNode');
            if (!($delegateNode instanceof $)) {
                self.set('delegateNode', $($delegateNode));
            }

            self._bindTrigger();
        },

        /**
         * 渲染组件
         * @returns {Popup}
         */
        render: function() {
            var self = this;
            Overlay.prototype.render.apply(self, arguments);
            return self;
        },

        show: function() {
            var self = this;
            if (self.get('disabled')) {
                return self;
            }
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

            Overlay.prototype.remove.apply(self, arguments);

            return self;
        }
    });


    module.exports = Popup;
});