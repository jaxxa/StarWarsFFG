/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class swffgActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["starwars-ffg", "sheet", "actor"],
      template: "systems/starwars-ffg/templates/actor/character-sheet.html",
      width: 600,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    
    // add labels for localization
    
    for (let category of Object.keys(data.data.skills)) {
      for (let skill of Object.keys(data.data.skills[category])) {
        const strId = `SWFFG.Skill${this._capitalize(skill)}`;
        const localizedField = game.i18n.localize(strId);
        data.data.skills[category][skill].label = localizedField;
      }
    }
    
    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });

    // Setup dice pool image
    html.find(".skill").each((_, elem) => {
      this._addSkillDicePool(elem)
    });

    // Roll Skill
    html.find(".roll-button").children().on("click", async (event) => {
      let upgradeType = null;
      if (event.ctrlKey && !event.shiftKey) {
        upgradeType = "ability"
      } else if (!event.ctrlKey && event.shiftKey) {
        upgradeType = "difficulty";
      }
      await this._rollSkill(event, upgradeType);
    });
  }

  /* -------------------------------------------- */

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return this.actor.createOwnedItem(itemData);
  }
  
  /**
   * @param {Event} event   The originating click event
   * @param  {String} upgradeType   Type of dice pool upgrade
   */
  async _rollSkill(event, upgradeType) {
    const data = this.getData();
    const row = event.target.parentElement.parentElement;
    const skillName = row.parentElement.dataset["ability"];
    const skillCategory = row.parentElement.dataset["category"];
    const skill = data.data.skills[skillCategory][skillName];
    const characteristic = data.data.characteristics[skill.characteristic];

    const dicePool = new DicePoolFFG({
      ability: Math.max(characteristic.value, skill.rank),
      difficulty: 2 // Default to average difficulty
    });
    dicePool.upgrade(Math.min(characteristic.value, skill.rank));

    if (upgradeType === "ability") {
      dicePool.upgrade();
    }  else if (upgradeType === "difficulty") {
      dicePool.upgradeDifficulty()
    }

    await this._completeRoll(dicePool, `${game.i18n.localize("SWFFG.DiceWindowTitle")} ${skill.label}`, skill.label);
  }

  /**
   * @param  {Object} dicePool    Assembled dice pool
   * @param  {String} windowTitle   Window Title
   * @param  {String} chatDescription   Chat Message
   */
  async _completeRoll(dicePool, windowTitle, chatDescription) {
    const id = randomID();

    const content = await renderTemplate("systems/starwars-ffg/templates/dice/roll-options.html", {
      dicePool,
      id,
    });

    new Dialog({
      title: windowTitle || game.i18n.localize("SWFFG.DiceDefaultWindowTitle"),
      content,
      buttons: {
        one: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize("SWFFG.DiceWindowRoll"),
          callback: () => {
            const container = document.getElementById(id);
            const finalPool = DicePoolFFG.fromContainer(container);
            const content = game.specialDiceRoller.starWars.rollFormula(
              finalPool.renderDiceExpression(), chatDescription,
            );

            ChatMessage.create({
              user: game.user._id,
              speaker: this.getData(),
              content,
            });
          }
        },
        two: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("SWFFG.DiceWindowCancel"),
        }
      },
    }).render(true)
  }

  /**
   * @param  {Object} elem    DOM object to place dice pool image
   */
  _addSkillDicePool(elem) {
    const data = this.getData();
    const skillName = elem.dataset["ability"];
    const skillCategory = elem.dataset["category"];
    const skill = data.data.skills[skillCategory][skillName];
    const characteristic = data.data.characteristics[skill.characteristic];
    const dicePool = new DicePoolFFG({
      ability: Math.max(characteristic.value, skill.rank),
    });
    dicePool.upgrade(Math.min(characteristic.value, skill.rank));

    const rollButton = elem.querySelector(".roll-button");
    dicePool.renderPreview(rollButton)
  }


  _capitalize(s) {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
  }
}
