import { apiFetch } from "./base.js";

export const StockApi={
    listMovements(){
        // Usa skipFeedback porque a página já tem loading local
        return apiFetch("/stock/movements", { skipFeedback: true });
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
    
