using System.Threading.Tasks;
using Warehouse.DTOs.PackingList;

namespace Warehouse.Services.Interfaces
{
    public interface IPackingListService
    {
        Task<int> CreatePackingList(CreatePackingListDto dto);
    }
}
