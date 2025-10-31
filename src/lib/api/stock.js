import { apiFetch } from "./base.js";

export const StockApi={
    listMovements(){
        return apiFetch("/stock/movements");
    },
    getByPiece(pieceId){
        return apiFetch(`/stock/piece/${pieceId}`);
    },
    create(payload){
        return apiFetch("/stock",{
            method:"POST",
            body:JSON.stringify(payload)
        });
    }
}
    
