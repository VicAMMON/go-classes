/**
 * go.Cookie: доступ к cookie
 *
 * @package    go.js
 * @subpackage Carcas
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 * @uses       go.Class
 * @uses       go.Ext
 */
/*jslint node: true, nomen: true */
/*global window, go */

"use strict";

if (!window.go) {
    throw new Error("go.core is not found");
}

/**
 * @name go.Cookie
 * @type {go.Cookie.CookieClass}
 */
go("Cookie", ["Class", "Ext"], function (go, global) {

    var CookieClass, cookie, expiresS, document = global.document;

    /**
     * @class go.Cookie.CookieClass
     * @augments go.Ext.Options
     */
    CookieClass = go.Class(go.Ext.Options, {

        /**
         * @ignore
         */
        'options': {
            'expires' : undefined,
            'path'    : undefined,
            'domain'  : undefined,
            'secure'  : false,
            'max-age' : false,
            'delete-value': "deleted"
        },

        /**
         * @constructs
         * @param {Object} options
         */
        '__construct': function (options) {
            this.initOptions(options || {});
        },

        /**
         * Установить значение куки
         *
         * @name go.Cookie.CookieClass#set
         * @public
         * @param {String} name
         * @param {String} value
         * @param {Object} [params]
         */
        'set': function (name, value, params) {
            var header = this.createCookieHeader(name, value, params);
            this.saveCookieHeader(header);
        },

        /**
         * Установить значение списка кук
         *
         * @name go.Cookie.CookieClass#setList
         * @public
         * @param {Object.<String, String>} cooks
         * @param {Object} [params]
         */
        'setList': function (cooks, params) {
            var name;
            for (name in cooks) {
                if (cooks.hasOwnProperty(name)) {
                    this.set(name, cooks[name], params);
                }
            }
        },

        /**
         * Получить значение куки
         *
         * @name go.Cookie.CookieClass#get
         * @public
         * @param {String} name
         * @return {String}
         */
        'get': function (name) {
             return this.getAll()[name];
        },

        /**
         * Получить значение всех кук
         *
         * @name go.Cookie.CookieClass#getAll
         * @public
         * @return {Object}
         */
        'getAll': function () {
            var cooks = this.loadCookieHeader().split(";"),
                cook,
                result = {},
                len = cooks.length,
                i,
                name,
                value;
            for (i = 0; i < len; i += 1) {
                cook = cooks[i].split("=", 2);
                name = cook[0].replace(/^\s+/, "").replace(/\s+$/, "");
                value = (cook.length === 2) ? cook[1] : "";
                result[name] = this.unescapeValue(value);
            }
            return result;
        },

        /**
         * Удалить куку
         *
         * @name go.Cookie.CookieClass#remove
         * @public
         * @param {String} name
         */
        'remove': function (name) {
            this.set(name, this.options['delete-value'], {'expires': "delete"});
        },

        /**
         * Сформировать заголовок для записи в document.cookie
         *
         * @name go.Cookie.CookieClass#createCookieHeader
         * @protected
         * @param {String} name
         * @param {String} value
         * @param {Object} [params]
         * @return {String}
         */
        'createCookieHeader': function (name, value, params) {
            var header = [], expires, now, delta;
            header.push(name + "=" + this.escapeValue(value));
            params = this.normalizeParams(params || {});
            if (params.expires) {
                now = this.getNow();
                expires = CookieClass.parseExpires(params.expires, now);
                if (expires) {
                    delta = -1;
                    if (this.options["max-age"]) {
                        delta = expires.getTime() - now.getTime();
                        if (delta >= 0) {
                            header.push("Max-Age=" + Math.round(delta / 1000));
                        }
                    }
                    if (delta < 0) {
                        header.push("Expires=" + expires.toUTCString());
                    }
                }
            }
            if (params.path) {
                header.push("Path=" + params.path);
            }
            if (params.domain) {
                header.push("Domain=" + params.domain);
            }
            if (params.secure) {
                header.push("Secure");
            }
            return header.join("; ");
        },

        /**
         * Экранирование значения для записи в document.cookie
         *
         * @name go.Cookie.CookieClass#escapeValue
         * @protected
         * @param {String} unescapedValue
         * @return {String}
         */
        'escapeValue': function (unescapedValue) {
            return encodeURIComponent(unescapedValue);
        },

        /**
         * Приведение значения, полученного из document.cookie в нормальный вид
         *
         * @name go.Cookie.CookieClass#unescapeValue
         * @protected
         * @param {String} escapedValue
         * @return {String}
         */
        'unescapeValue': function (escapedValue) {
            return decodeURIComponent(escapedValue);
        },

        /**
         * @name go.Cookie.CookieClass#saveCookieHeader
         * @protected
         * @param {String} header
         */
        'saveCookieHeader': function (header) {
            document.cookie = header;
        },

        /**
         * @name go.Cookie.CookieClass#loadCookieHeader
         * @protected
         * @return {String}
         */
        'loadCookieHeader': function () {
            return document.cookie;
        },

        /**
         * Получить текущее время (от которого отсчитывается expires)
         *
         * @name go.Cookie.CookieClass#getNow
         * @protected
         * @return {Date}
         */
        'getNow': function () {
            return (new Date());
        },

        /**
         * Заполнение всех параметров
         *
         * @name go.Cookie.CookieClass#normalizeParams
         * @private
         * @param {Object} params
         * @retunr {Object}
         */
        'normalizeParams': function (params) {
            var comp = ["expires", "path", "domain", "secure"],
                len = comp.length,
                i,
                result = {},
                c;
            for (i = 0; i < len; i += 1) {
                c = comp[i];
                if (params.hasOwnProperty(c)) {
                    result[c] = params[c];
                } else {
                    result[c] = this.options[c];
                }
            }
            return result;
        }

    });

    expiresS = {
        'minute' : 60,
        'hour'   : 3600,
        'day'    : 86400,
        'week'   : 604800
    };

    /**
     * Приведение всех возможных форматов expires к Date
     *
     * @name go.Cookie.CookieClass.pareseExpires
     * @param {*} expires
     * @param {Date} [now]
     * @return {Date}
     * @throws go.Cookie.CookieClass.Exceptions.ErrorExpires
     */
    CookieClass.parseExpires = function (expires, now) {
        if (typeof expires === "object") {
            if ((expires instanceof Date) || (Object.prototype.toString.call(expires) === "[object Date]")) {
                return (new Date(expires.toUTCString()));
            }
            throw new CookieClass.go.Cookie.CookieClass.Exceptions.ErrorExpires("Error object in expires");
        }

        if (typeof expires === "string") {
            if (expiresS[expires]) {
                expires = expiresS[expires];
            } else if (/^[0-9]{1,9}$/.test(expires)) {
                expires = parseInt(expires, 10);
            }
        }

        if (typeof expires === "number") {
            if (expires < 1000000000) {
                expires = (now || new Date()).getTime() + expires * 1000;
            }
            return new Date(expires);
        }

        switch (expires) {
            case 'month':
                expires = now ? (new Date(now.getTime())) : new Date();
                expires.setMonth(expires.getMonth() + 1);
                return expires;
            case 'year':
                expires = now ? (new Date(now.getTime())) : new Date();
                expires.setFullYear(expires.getFullYear() + 1);
                return expires;
            case 'delete':
                return (new Date(10));
            case 'session':
                return void(0);
        }
        now = new Date(expires);
        if (isNaN(now.getTime())) {
            throw new CookieClass.Exceptions.ErrorExpires('Error expires "' + expires + '"');
        }
        return now;
    };

    /**
     * @namespace go.Cookie.CookieClass.Exceptions
     *            исключения при работе с библиотекой
     */
    CookieClass.Exceptions = (function () {
        var create = go.Lang.Exception.create,
            Base = create("go.Cookie.CookieClass.Exceptions.Base", go.Lang.Exception);
        return {

            /**
             * @class go.Cookie.CookieClass.Exceptions.Base
             *        базовое исключение при работе с библиотекой
             * @abstract
             */
            'Base': Base,

            /**
             * @class go.Cookie.CookieClass.Exceptions.ErrorExpires
             *        неверный формат expires
             * @augments go.Cookie.CookieClass.Exceptions.Base
             */
            'ErrorExpires': create("go.Cookie.CookieClass.Exceptions.ErrorExpires", Base)
        };
    }());

    cookie = new CookieClass();
    cookie.CookieClass = CookieClass;

    return cookie;
});