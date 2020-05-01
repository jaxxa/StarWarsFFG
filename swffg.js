/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 * Software License: GNU GPLv3
 */

// Import Modules
import { SWFFG } from "./module/config.js";
import { SimpleItemSheet } from "./module/item-sheet.js";
import { SimpleActorSheet } from "./module/actor-sheet-simple.js";
import { ActorSheetFFG } from "./module/actor-sheet-ffg.js";
import { DicePoolFFG } from "./module/dice-pool-ffg.js"

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function() {
  console.log(`D&D5e | Initializing Dungeons & Dragons 5th Edition System\n${SWFFG.ASCII}`);

	/**
	 * Set an initiative formula for the system
	 * @type {String}
	 */
	CONFIG.Combat.initiative = {
	  formula: "//sw 2a 1p",
    decimals: 2
  };

  // Register sheet application classes
  //Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("swffg", ActorSheetFFG, { makeDefault: true });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("swffg", SimpleItemSheet, {makeDefault: true});

  // Add utilities to the global scope, this can be useful for macro makers
  window.DicePoolFFG = DicePoolFFG;

  // Register Handlebars utilities
  Handlebars.registerHelper("json", JSON.stringify);

  Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper('select', function( value, options ){
    var $el = $('<select />').html( options.fn(this) );
    $el.find('[value="' + value + '"]').attr({'selected':'selected'});
    return $el.html();
});
});
