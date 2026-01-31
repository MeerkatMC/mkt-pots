import {
  EquipmentSlot,
  ItemStack,
  BlockComponentPlayerInteractEvent,
  BlockComponentPlayerBreakEvent,
  BlockCustomComponent,
  GameMode,
  BlockPermutation,
} from "@minecraft/server";
import { BlockStateSuperset } from "@minecraft/vanilla-data";

export type DisplayItemEntry = {
  catergory: number;
  variant: number;
  sound: string;
};

export type DisplayItems = {
  [key: string]: DisplayItemEntry;
};

export class DisplayItem implements BlockCustomComponent {
  display_items: DisplayItems;

  constructor(display_items: DisplayItems) {
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
  find_display_item(catergory: number, variant: number): any {
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
  get_display_item(permutation: BlockPermutation): any {
    return this.find_display_item(
      permutation.getState("mkt:catergory" as keyof BlockStateSuperset) as number,
      permutation.getState("mkt:variant" as keyof BlockStateSuperset) as number
    );
  } /* get_display_item() */

  /*
   * Description: This method will check for updates to the display block state
   *        Args: event - BlockComponentPlayerInteractEvent
   *      Return: None
   */
  onPlayerInteract(event: BlockComponentPlayerInteractEvent) {
    const { block, dimension, player } = event;

    const equippable = player?.getComponent("minecraft:equippable");
    const mainhand = equippable?.getEquipmentSlot(EquipmentSlot.Mainhand);
    if (!mainhand) return;

    const current_item = this.get_display_item(block?.permutation);

    // Check to remove item from display
    if (!mainhand.hasItem()) {
      if (current_item != undefined && current_item != "empty") {
        dimension.spawnItem(new ItemStack(current_item), block.center());
        block.setPermutation(
          block.permutation
            .withState("mkt:catergory" as keyof BlockStateSuperset, 0)
            .withState("mkt:variant" as keyof BlockStateSuperset, 0)
        );
      }
    } else {
      // Lookup the item held and see if its attachable to the DisplayItem
      const display_item = this.display_items[mainhand.typeId];
      if (display_item === null) return;

      if (current_item != undefined && current_item != "empty") {
        // Check for "no change" condition for early exit
        if (mainhand.typeId == current_item) return;

        dimension.playSound("random.pop", block.center());

        // drop the previously attached item
        dimension.spawnItem(new ItemStack(current_item), block.center());
      }

      // Set the newly attached item
      block.setPermutation(
        block.permutation
          .withState("mkt:catergory" as keyof BlockStateSuperset, display_item.catergory)
          .withState("mkt:variant" as keyof BlockStateSuperset, display_item.variant)
      );

      // Play generic place (into pot dirt) sound
      dimension.playSound(display_item.sound, block.center(), { volume: 0.5 });

      // If we are in survival then we need to decrement the player item stack
      if (player?.getGameMode() === GameMode.Survival) {
        if (mainhand.amount > 1) {
          mainhand.amount--;
        } else {
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
  onPlayerBreak(event: BlockComponentPlayerBreakEvent) {
    const { block, brokenBlockPermutation, dimension } = event;

    let current_item = this.get_display_item(brokenBlockPermutation);

    if (current_item != undefined && current_item != "empty") {
      dimension.spawnItem(new ItemStack(current_item), block.center());
    }
  } /* onPlayerBreak() */
} /* DisplayItem */
