/**
 * Internationalisation, available as `kairojs/i18n`.
 *
 * This is the only part of Kairo that touches `i18next`, which is why it sits behind its own subpath
 * export and its own optional peer dependency: a bot that never imports this module never needs
 * `i18next` installed.
 *
 * Register {@link I18nPlugin} on the client, put your translations under `languages/<locale>/`, and
 * reach for {@link resolveKey} or {@link fetchT} wherever a bot would otherwise hard-code English.
 *
 * @since 1.0.0
 */

export { default as i18next } from "i18next";

export * from "./lib/backend.ts";
export * from "./lib/functions.ts";
export * from "./lib/handler.ts";
export * from "./lib/plugin.ts";
