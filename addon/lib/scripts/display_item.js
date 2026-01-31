import { EquipmentSlot, ItemStack, GameMode, } from "@minecraft/server";
export class DisplayItem {
    constructor(display_items) {
        this.display_items = display_items;
        // bind the methods to avoid issues with "this" being lost in scope.
        this.onPlayerBreak = this.onPlayerBreak.bind(this);
        this.onPlayerInteract = this.onPlayerInteract.bind(this);
    } /* constructor() */
    /*
     * Description: This method will find the key for a given category and variant
     *        Args: catergory - the block attached item catergory
     *              variant   - the block attached item variant
     *      Return: current item attached to block / undefined
     */
    find_display_item(catergory, variant) {
        for (const key in this.display_items) {
            if (this.display_items[key].catergory === catergory && this.display_items[key].variant === variant) {
                return key;
            }
        }
        return undefined;
    } /* find_display_item() */
    /*
     * Description: This method will get the current item attached to block
     *        Args: permutation - the custom block permutation to query
     *      Return: current item attached to block / undefined
     */
    get_display_item(permutation) {
        return this.find_display_item(permutation.getState("mkt:catergory"), permutation.getState("mkt:variant"));
    } /* get_display_item() */
    /*
     * Description: This method will check for updates to the display block state
     *        Args: event - BlockComponentPlayerInteractEvent
     *      Return: None
     */
    onPlayerInteract(event) {
        const { block, dimension, player } = event;
        const equippable = player === null || player === void 0 ? void 0 : player.getComponent("minecraft:equippable");
        const mainhand = equippable === null || equippable === void 0 ? void 0 : equippable.getEquipmentSlot(EquipmentSlot.Mainhand);
        if (!mainhand)
            return;
        const current_item = this.get_display_item(block === null || block === void 0 ? void 0 : block.permutation);
        // Check to remove item from display
        if (!mainhand.hasItem()) {
            if (current_item != undefined && current_item != "empty") {
                dimension.spawnItem(new ItemStack(current_item), block.center());
                block.setPermutation(block.permutation
                    .withState("mkt:catergory", 0)
                    .withState("mkt:variant", 0));
            }
        }
        else {
            // Lookup the item held and see if its attachable to the DisplayItem
            const display_item = this.display_items[mainhand.typeId];
            if (display_item === null)
                return;
            if (current_item != undefined && current_item != "empty") {
                // Check for "no change" condition for early exit
                if (mainhand.typeId == current_item)
                    return;
                dimension.playSound("random.pop", block.center());
                // drop the previously attached item
                dimension.spawnItem(new ItemStack(current_item), block.center());
            }
            // Set the newly attached item
            block.setPermutation(block.permutation
                .withState("mkt:catergory", display_item.catergory)
                .withState("mkt:variant", display_item.variant));
            // Play generic place (into pot dirt) sound
            dimension.playSound(display_item.sound, block.center(), { volume: 0.5 });
            // If we are in survival then we need to decrement the player item stack
            if ((player === null || player === void 0 ? void 0 : player.getGameMode()) === GameMode.Survival) {
                if (mainhand.amount > 1) {
                    mainhand.amount--;
                }
                else {
                    mainhand.setItem(undefined);
                }
            }
        }
    } /* onPlayerInteract() */
    /*
     * Description: This method will check for update the block states
     *        Args: event - BlockComponentPlayerDestroyEvent
     *      Return: None
     */
    onPlayerBreak(event) {
        const { block, brokenBlockPermutation, dimension } = event;
        let current_item = this.get_display_item(brokenBlockPermutation);
        if (current_item != undefined && current_item != "empty") {
            dimension.spawnItem(new ItemStack(current_item), block.center());
        }
    } /* onPlayerBreak() */
} /* DisplayItem */
//# sourceMappingURL=display_item.js.map