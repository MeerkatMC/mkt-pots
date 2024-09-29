/* 
 * Description: This file contains all of the custom block registration code
 *              built into the "coloured_pot" class to isolate the code
 *              from top level scripting.
 */
import { EquipmentSlot, ItemStack, GameMode, world } from '@minecraft/server';

/* List of coloured_pot attachable items and content catergory */
const pot_items = {
    "minecraft:dandelion":          { catergory: "flower", },
    "minecraft:poppy":              { catergory: "flower", },
    "minecraft:blue_orchid":        { catergory: "flower", },
    "minecraft:azure_bluet":        { catergory: "flower", },
    "minecraft:pink_tulip":         { catergory: "flower", },
    "minecraft:white_tulip":        { catergory: "flower", },
    "minecraft:orange_tulip":       { catergory: "flower", },
    "minecraft:red_tulip":          { catergory: "flower", },
    "minecraft:allium":             { catergory: "flower", },
    "minecraft:oxeye_daisy":        { catergory: "flower", },
    "minecraft:cornflower":         { catergory: "flower", },
    "minecraft:lily_of_the_valley": { catergory: "flower", },
    "minecraft:torchflower":        { catergory: "flower", },
    "minecraft:wither_rose":        { catergory: "flower", },
    "minecraft:deadbush":           { catergory: "flower", },
    "minecraft:fern":               { catergory: "flower", },

    "minecraft:azalea":             { catergory: "azalea", },
    "minecraft:flowering_azalea":   { catergory: "azalea", },

    "minecraft:crimson_fungus":     { catergory: "fungus", },
    "minecraft:warped_fungus":      { catergory: "fungus", },
    "minecraft:brown_mushroom":     { catergory: "fungus", },
    "minecraft:red_mushroom":       { catergory: "fungus", },
    "minecraft:crimson_roots":      { catergory: "fungus", },
    "minecraft:warped_roots":       { catergory: "fungus", },

    "minecraft:oak_sapling":        { catergory: "sapling", },
    "minecraft:dark_oak_sapling":   { catergory: "sapling", },
    "minecraft:spruce_sapling":     { catergory: "sapling", },
    "minecraft:jungle_sapling":     { catergory: "sapling", },
    "minecraft:acacia_sapling":     { catergory: "sapling", },
    "minecraft:cherry_sapling":     { catergory: "sapling", },
    "minecraft:birch_sapling":      { catergory: "sapling", },
    "minecraft:mangrove_propagule": { catergory: "sapling", },

    "minecraft:cactus":             { catergory: "cactus", },
    "minecraft:bamboo":             { catergory: "bamboo", },
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
