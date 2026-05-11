using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Warehouse.DTOs.Pallet;
using Warehouse.Enums;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;

namespace Warehouse.Services.Implementations
{
    public class PalletService : IPalletService
    {
        private readonly ISalesOrderRepository _orderRepository;
        private readonly IInventoryRepository _inventoryRepository;
        private readonly IGenericRepository<Pallet> _palletRepository;
        private readonly AppDbContext _context;

        public PalletService(
            ISalesOrderRepository orderRepository,
            IInventoryRepository inventoryRepository,
            IGenericRepository<Pallet> palletRepository,
            AppDbContext context)
        {
            _orderRepository = orderRepository;
            _inventoryRepository = inventoryRepository;
            _palletRepository = palletRepository;
            _context = context;
        }

        public async Task<int> CreatePalletFromOrder(CreatePalletDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            var order = await _orderRepository.GetOrderWithItems(dto.SalesOrderId);

            if (order == null)
                throw new InvalidOperationException("Order not found");

            if (order.Status != SalesOrderStatus.Confirmed)
                throw new InvalidOperationException("Order must be confirmed");

            var pallet = new Pallet
            {
                SalesOrderId = dto.SalesOrderId,
                PackingType = dto.PackagingType,
                PalletCode = $"PALT-{dto.SalesOrderId}-{dto.PackagingType}-{DateTime.UtcNow.Ticks}",
                Items = new List<PalletItem>()
            };

            foreach (var item in order.SalesOrderItems)
            {
                var remaining = item.Quantity;

                var inventories = await _inventoryRepository
                    .GetInventoriesByProduct(item.ProductId);

                foreach (var inv in inventories.OrderBy(i => i.Id))
                {
                    if (inv.ReservedQuantity <= 0)
                        continue;

                    var toPick = Math.Min(inv.ReservedQuantity, remaining);

                    inv.ReservedQuantity -= toPick;
                    await _inventoryRepository.UpdateAsync(inv);

                    pallet.Items.Add(new PalletItem
                    {
                        ProductId = item.ProductId,
                        Quantity = toPick
                    });

                    remaining -= toPick;

                    if (remaining == 0)
                        break;
                }

                if (remaining > 0)
                    throw new InvalidOperationException("Not enough reserved stock to pick");
            }

            await _palletRepository.AddAsync(pallet);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return pallet.Id;
        }
    }
}
