// Import Modules
import { swffgActor } from "./actor/actor.js";
import { swffgActorSheet } from "./actor/actor-sheet.js";
import { swffgItem } from "./item/item.js";
import { swffgItemSheet } from "./item/item-sheet.js";
import { DicePoolFFG } from "./dice/dice-pool.js"

Hooks.once('init', async function() {

  game["starwars-ffg"] = {
    swffgActor,
    swffgItem
  };

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d20",
    decimals: 2
  };

  // Define custom Entity classes
  CONFIG.Actor.entityClass = swffgActor;
  CONFIG.Item.entityClass = swffgItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("starwars-ffg", swffgActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("starwars-ffg", swffgItemSheet, { makeDefault: true });

  // Add utilities to the global scope, this can be useful for macro makers
  window.DicePoolFFG = DicePoolFFG;

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function() {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('toLowerCase', function(str) {
    return str.toLowerCase();
  });
  
  Handlebars.registerHelper("json", JSON.stringify);
});