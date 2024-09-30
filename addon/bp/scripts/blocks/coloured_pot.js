/* 
 * Description: This file contains all of the custom block registration code
 *              built into the "coloured_pot" class to isolate the code
 *              from top level scripting.
 */
import { EquipmentSlot, ItemStack, GameMode, world } from '@minecraft/server';

/* List of coloured_pot attachable items and content catergory */
const pot_items = {
    "empty":                        { catergory: 0, variant: 0, },
    "minecraft:crimson_fungus":     { catergory: 0, variant: 1, },
    "minecraft:warped_fungus":      { catergory: 0, variant: 2, },
    "minecraft:brown_mushroom":     { catergory: 0, variant: 3, },
    "minecraft:red_mushroom":       { catergory: 0, variant: 4, },
    "minecraft:crimson_roots":      { catergory: 0, variant: 5, },
    "minecraft:warped_roots":       { catergory: 0, variant: 6, },
    "minecraft:azalea":             { catergory: 0, variant: 7, },
    "minecraft:flowering_azalea":   { catergory: 0, variant: 8, },
    "minecraft:cactus":             { catergory: 0, variant: 9, },
    "minecraft:bamboo":             { catergory: 0, variant: 10, },

    "minecraft:dandelion":          { catergory: 1, variant: 0, },
    "minecraft:poppy":              { catergory: 1, variant: 1, },
    "minecraft:blue_orchid":        { catergory: 1, variant: 2, },
    "minecraft:azure_bluet":        { catergory: 1, variant: 3, },
    "minecraft:pink_tulip":         { catergory: 1, variant: 4, },
    "minecraft:white_tulip":        { catergory: 1, variant: 5, },
    "minecraft:orange_tulip":       { catergory: 1, variant: 6, },
    "minecraft:red_tulip":          { catergory: 1, variant: 7, },
    "minecraft:allium":             { catergory: 1, variant: 8, },
    "minecraft:oxeye_daisy":        { catergory: 1, variant: 9, },
    "minecraft:cornflower":         { catergory: 1, variant: 10, },
    "minecraft:lily_of_the_valley": { catergory: 1, variant: 11, },
    "minecraft:torchflower":        { catergory: 1, variant: 12, },
    "minecraft:wither_rose":        { catergory: 1, variant: 13, },
    "minecraft:deadbush":           { catergory: 1, variant: 14, },
    "minecraft:fern":               { catergory: 1, variant: 15, },
   
    "minecraft:oak_sapling":        { catergory: 2, variant: 0, },
    "minecraft:dark_oak_sapling":   { catergory: 2, variant: 1, },
    "minecraft:spruce_sapling":     { catergory: 2, variant: 2, },
    "minecraft:jungle_sapling":     { catergory: 2, variant: 3, },
    "minecraft:acacia_sapling":     { catergory: 2, variant: 4, },
    "minecraft:cherry_sapling":     { catergory: 2, variant: 5, },
    "minecraft:birch_sapling":      { catergory: 2, variant: 6, },
    "minecraft:mangrove_propagule": { catergory: 2, variant: 7, },
};

export class coloured_pot
{
    /* 
     * Description: This method will register the coloured_pot "change_flower" custom component handler(s)
     *        Args: None
     *      Return: None
     */
    static init() 
    {
        // add listenrs for custom block placement and destroy events so we can re-evaluate
        // the states of any blocks connected to the new/old block.
        try {
            world.beforeEvents.worldInitialize.subscribe((ievent) => {
                ievent.blockComponentRegistry.registerCustomComponent( "bap:change_flower", 
                    {
                        onPlayerInteract: (event) => {
                            this.update_flower_pot_state( event );
                        },
                        onPlayerDestroy: (event) => 
                        {
                            this.release_flower_pot_items( event );
                        }
                    }
                );
            });
        } catch  {}
    }   /* init() */

    /* 
     * Description: This method will get the current item attached to pot
     *        Args: block - the custom block to query
     *      Return: current item attached to pot / undefined
     */
    static get_content_item( block )
    {
        let contents = block.permutation.getState( 'bap:pot_contents' );
        let item     = undefined;

        switch ( contents )
        {
            case 'flower':
                item = block.permutation.getState( 'bap:flower_type' );
                break;
            case 'azalea':
                item = block.permutation.getState( 'bap:azalea_type' );
                break;
            case 'sapling':
                item = block.permutation.getState( 'bap:sapling_type' );
                break;
            case 'fungus':
                item = block.permutation.getState( 'bap:fungus_type' );
                break;
            case 'bamboo':
                item = 'minecraft:bamboo';
                break;                   
            case 'cactus':
                item = 'minecraft:cactus';
                break;
            default:
                break;
        }

        return item;
    }   /* get_content_item() */

    /* 
     * Description: This method will check for update the block states
     *        Args: event - BlockComponentPlayerInteractEvent 
     *      Return: None
     */
    static update_flower_pot_state( event )
    {
        const { block, dimension, player } = event;

        const equippable = player.getComponent("minecraft:equippable");
        if ( !equippable ) return;

        const mainhand = equippable.getEquipmentSlot(EquipmentSlot.Mainhand);
        let contents = block.permutation.getState( 'bap:pot_contents' );
        let current_item = this.get_content_item( block );
        
        // Check to remove flower from pot
        if ( !mainhand.hasItem() )
        {
            if ( current_item != undefined )
            {
                dimension.spawnItem( new ItemStack(current_item), block.center() );
                block.setPermutation( block.permutation.withState( "bap:pot_contents", 'empty' ) );
            }
        }
        else
        {
            // Lookup the item held and see if its attachable to the coloured_pot
            const pot_item = pot_items[mainhand.typeId];
            if (!pot_item) return;

            if ( current_item != undefined )
            {
                // Check for "no change" condition for early exit
                if ( mainhand.typeId == current_item ) return;

                dimension.playSound( "random.pop", block.center() );

                // drop the previously attached item
                dimension.spawnItem( new ItemStack(current_item), block.center() );
            }

            // Set the content catergory
            block.setPermutation( block.permutation.withState( "bap:pot_contents", pot_item.catergory ) );

            // Set the content specific variant
            switch ( pot_item.catergory )
            {
                case 'flower':
                    block.setPermutation( block.permutation.withState( "bap:flower_type", mainhand.typeId ) );
                    break;
                case 'fungus':
                    block.setPermutation( block.permutation.withState( "bap:fungus_type", mainhand.typeId ) );
                    break;
                case 'sapling':
                    block.setPermutation( block.permutation.withState( "bap:sapling_type", mainhand.typeId ) );
                    break;
                case 'azalea':
                    block.setPermutation( block.permutation.withState( "bap:azalea_type", mainhand.typeId ) );
                    break;
                default:
                    break;
            }

            // Play generic place (into pot dirt) sound
            dimension.playSound( "dig.grass", block.center(), { volume: 0.5 } );

            // If we are in survival then we need to decrement the player item stack
            if ( player.getGameMode() === 'survival' )
            {
                if ( mainhand.amount > 1)
                {
                    mainhand.amount--;
                }
                else
                {
                    mainhand.setItem(undefined);
                }   
            }
        }
    }   /* update_flower_pot_state() */

    /* 
     * Description: This method will check for update the block states
     *        Args: event - BlockComponentPlayerDestroyEvent 
     *      Return: None
     */
    static release_flower_pot_items( event )
    {
        const { block, destroyedBlockPermutation, dimension } = event;

        let contents = destroyedBlockPermutation.getState( 'bap:pot_contents' );
        if ( contents != 'empty' )
        {
            switch ( contents )
            {
                case 'flower':
                    dimension.spawnItem( new ItemStack(destroyedBlockPermutation.getState( 'bap:flower_type' )), block.center() );
                    break;
                case 'azalea':
                    dimension.spawnItem( new ItemStack(destroyedBlockPermutation.getState( 'bap:azalea_type' )), block.center() );
                    break;
                case 'sapling':
                    dimension.spawnItem( new ItemStack(destroyedBlockPermutation.getState( 'bap:sapling_type' )), block.center() );
                    break;
                case 'fungus':
                    dimension.spawnItem( new ItemStack(destroyedBlockPermutation.getState( 'bap:fungus_type' )), block.center() );
                    break;
                case 'bamboo':
                    dimension.spawnItem( new ItemStack('minecraft:bamboo'), block.center() );
                    break;                   
                case 'cactus':
                    dimension.spawnItem( new ItemStack('minecraft:cactus'), block.center() );
                    break;
                default:
                    break;
            }
        }
    }  /* release_flower_pot_items() */
    
}   /* coloured_pot */
