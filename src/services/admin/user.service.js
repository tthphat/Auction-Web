import * as userModel from "../../models/user.model.js"

export const userService = {
    async getSeller(){
        const seller =  await userModel.findUsersByRole('seller')
        return seller;
    },
}