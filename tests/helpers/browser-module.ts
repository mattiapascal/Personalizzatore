/** Use the module already loaded by the app, including Vite's development version.
 * Importing its unversioned URL again can create a separate stateful cache. */
export function loadedEditorModule(path:string):string {
 return performance.getEntriesByType('resource').find(entry=>{
  try{const url=new URL(entry.name);return url.origin===location.origin&&url.pathname===path;}catch{return false;}
 })?.name??path;
}
