/**
 * go.js: библиотека для упрощения некоторых вещей в JavaScript
 *
 * В данном файле определяется только ядро библиотеки и модуль go.Lang.
 * Остальные модули располагаются в других файлах.
 *
 * @package go.js
 * @author  Григорьев Олег aka vasa_c (http://blgo.ru/)
 * @version 1.0-beta
 * @license MIT (http://www.opensource.org/licenses/mit-license.php)
 * @link    https://github.com/vasa-c/go-js
 */
"use strict";

/*global window */

var go = (function (global) {

	var VERSION = "1.0-beta",

		/**
		 * http-адрес каталога в котором находится go.js и модули
		 *
		 * @var string
		 */
		GO_DIR,

		/**
		 * Список модулей, для которых уже инициирована загрузка
		 *
		 * @var hash (имя => true)
		 */
		loading = {},

		doc = global.document;

	function go(name, module) {
		if (name) {
			go.appendModule(name, module);
		}
		return go;
	}
	go.VERSION = VERSION;

	/**
	 * go.include(): инициирование загрузки нужных модулей
	 * (только на этапе загрузки страницы)
	 *
	 * @param string[] names
	 *        имя нужного модуля или список из нескольких имён
	 */
	go.include = function (names) {
		var i, len, name, src;
		if (typeof names !== "object") {
			names = [names];
		}
		for (i = 0, len = names.length; i < len; i += 1) {
			name = names[i];
			if (!loading[name]) {
				src = GO_DIR + names[i] + ".js";
				doc.write('<script type="text/javascript" src="' + src + '"></script>');
				loading[name] = true;
			}
		}
	};

	/**
	 * go.appendModule(): добавление модуля в пространство имён
	 * (вызывается при определении модуля в соответствующем файле)
	 *
	 * @param string name
	 *        имя модуля
	 * @param object module
	 *        объект модуля
	 */
	go.appendModule = function (name, module) {
		go[name] = module;
		loading[name] = module;
	};

	/**
	 * Инициализация библиотеки
	 * - вычисление каталога с go.js
	 * - подключение модулей заданных в параметрах URL
	 *
	 * @todo оптимизировать и протестировать для различных вариантов URL
	 */
	(function () {

		var SRC_PATTERN = new RegExp("^(.*\\/)?go\\.js(\\?.*?l=(.*?))?$"),
			matches;

		if (doc.currentScript) {
			matches = SRC_PATTERN.exec(doc.currentScript.getAttribute("src"));
		}
		if (!matches) {
			matches = (function () {
				var scripts = doc.getElementsByTagName("script"),
					i,
					src,
					matches;
				for (i = scripts.length; i > 0; i -= 1) {
					src = scripts[i - 1].getAttribute("src");
					matches = SRC_PATTERN.exec(src);
					if (matches) {
						return matches;
					}
				}
			}());
		}

		if (!matches) {
			throw new Error("go.js is not found in DOM");
		}

		GO_DIR = matches[1];

		if (matches[3]) {
			go.include(matches[3].split(","));
		}

	}());

	return go;
}(window));

/**
 * @subpackage Lang
 * @namespace go.Lang
 */
go("Lang", (function (global) {

	var Lang = {

		/**
		 * Связывание функции с контекстом и аргументами
		 * Поведение аналогично Function.prototype.bind()
		 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
		 *
		 * Если для функции определён свой метод bind(), то используется он
		 *
		 * @namespace go.Lang
		 * @method bind
		 * @param function func
		 *        функция
		 * @param object thisArg [optional]
		 *        контекст в котором функция должна выполняться
		 *        по умолчанию - global
		 * @param list args [optional]
		 *        аргументы, вставляемые в начало вызова функции
		 * @return function
		 *         связанная с контекстом функция
		 * @todo протестировать в IE
		 */
		'bind': function (func, thisArg, args) {
			var result;
			thisArg = thisArg || global;
			if (func.bind) {
	            if (args) {
	                args = [thisArg].concat(args);
	            } else {
	                args = [thisArg];
	            }
	            return func.bind.apply(func, args);
			} else if (args) {
	            result = function () {
	                return func.apply(thisArg, args.concat(Array.prototype.slice.call(arguments, 0)));
	            };
	        } else {
	            result = function () {
	                return func.apply(thisArg, arguments);
	            };
	        }
			return result;
		},

		'eoc': null
	};

	return Lang;
}(window)));