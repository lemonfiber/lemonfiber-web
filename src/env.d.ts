/**
 * Stylesheets are imported for their effect, not their value.
 */
declare module "*.css";

/**
 * An asset imported with `?url` is the address the build serves it at.
 */
declare module "*?url" {
  const url: string;
  export default url;
}
