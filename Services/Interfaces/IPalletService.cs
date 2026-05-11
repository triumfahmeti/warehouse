using System.Threading.Tasks;
using Warehouse.DTOs.Pallet;

namespace Warehouse.Services.Interfaces
{
    public interface IPalletService
    {
        Task<int> CreatePalletFromOrder(CreatePalletDto dto);
    }
}
