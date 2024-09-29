/* 
 * Description: This file contains all of the custom block registration code
 *              built into the "block_components" class to isolate the code
 *              from top level scripting.
 */

import {coloured_pot} from "./coloured_pot.js"

export class block_components 
{
    /* 
     * Description: This method will register all scripted blocks in the addon 
     *        Args: None
     *      Return: None
     */
    static register_all_blocks() 
    {
        coloured_pot.init();
    }   /* register_all_blocks() */
}   /* block_components() */
